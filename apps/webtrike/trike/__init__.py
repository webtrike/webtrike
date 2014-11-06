# Copyright (c) 2003-2014 COMMONWEALTH SCIENTIFIC AND INDUSTRIAL RESEARCH
# ORGANISATION ('CSIRO'). All rights reserved.
# 
# This licence is based on the standard BSD Licence.
# 
# 1.   Redistribution and use of this software in source and binary forms, with
#     or without modification, are permitted provided that the following 
#     conditions are met:
#
#     *   Redistributions of the software in source code form must retain the
#         above copyright notice, this list of conditions and the following
#         disclaimer. 
#     *   Redistributions in of the software in binary code form must reproduce
#         the above copyright notice, this list of conditions and the following
#         disclaimer in the documentation and/or other materials provided with
#         the distribution. 
#     *   Neither the name of the CSIRO nor the names of its contributors may 
#         be used to endorse or promote products derived from this software 
#         without specific prior written permission. 
#
# 2.   THIS SOFTWARE IS PROVIDED BY CSIRO AND CONTRIBUTORS "AS IS" AND ANY
#     EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
#     WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
#     DISCLAIMED.
# 
# 3.   IN NO EVENT SHALL CSIRO OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
#     INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
#     (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
#     SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
#     CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
#     LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
#     OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
#     SUCH DAMAGE.
#
# The following section provides additional exclusionary and limitations
# provisions in addition to those of the standard BSD Licence:
#
# 4.   FOR CLARITY THE LIMITATIONS ON CSIRO AND CONTRIBUTORS' LIABILITY 
#     OUTLINED IN CLAUSES 2 AND 3 APPLY TO THE EXTENT PERMITTED BY LAW. CSIRO 
#     AND CONTRIBUTOR LIABILITY IN RESPECT OF ANY IMPLIED GUARANTEES WHICH 
#     CANNOT BE EXCLUDED UNDER LAW IS LIMITED AT CSIRO'S OPTION TO:
#
#     (i)     THE REPLACEMENT OF THE SOFTWARE OR THE SUPPLY OF EQUIVALENT
#             SOFTWARE;
#     (ii)    THE REPAIR OF THE SOFTWARE;
#     (iii)   THE PAYMENT OF THE COST OF REPLACING THE SOFTWARE OR OF ACQUIRING
#             EQUIVALENT SOFTWARE OR HAVING THE SOFTWARE REPAIRED.
#
# 5.   CSIRO LICENCES THE SOFTWARE ONLY TO THE EXTENT CSIRO HAS RIGHT, TITLE 
#     AND INTEREST IN THE SOFTWARE.
#
import collections
import copy
import inspect
import json
import logging
import re

"""This is the equivalent to the models infrastructure in django.
Nothing in this module should be used directly; instead, models
("commands", in Trike parlance) should extend from TrikeCommand, and
be composed of fields extending TrikeField or TrikePathField.

The rest of the module, and the contents of those classes, is a bit of
cautious metaclass programming and introspection in order to achieve
the django-model-like simple API.

A TrikeCommand is essentially a wrapper around the json documents that
Trike deals in.  A command holds the root of a document, and the field
instances then recursively point in to subsets of the document,
generally determined automatically by the field name (note that both
commands and fields have a common base).  This document is mutable, so
editing a field will affect the original copy.  This is by design; the
parent command holds on to the json document, a field may edit it,
then when the document is sent to trike it contains the alterations as
set by the fields.

You get an instance of a command by invoking it, ie calling the
classmethod `invoke()`, with the relevant keyword arguments (which map
to params in the underlying json document).

"""

logger = logging.getLogger('apps.webtrike.trike')

first_cap_re = re.compile(r'(.)([A-Z][a-z]+)')
all_cap_re = re.compile(r'([a-z0-9])(A-Z)')
def convert_name(name):
    "Convert CamelCase to camel-case (as used by trike, but not valid python identifiers)"
    s = first_cap_re.sub(r'\1-\2', name)
    return all_cap_re.sub(r'\1-\2', s).lower()

class TrikeBaseMeta(type):
    """
    Metaclass used by the base trike interaction class.  Ensures that
    default attributes are created automatically, etc.
    """
    def __new__(cls, name, bases, attrs):
        # Make sure we know what command (and response name, if that's
        # important) to use in communicating with the framework.  In
        # most cases this can be derived from the class name, but
        # occasionally it will need to be overridden.  Ignore if we're
        # still just looking at the base class:
        if name != 'TrikeCommand':
            converted_name = convert_name(name)
            if 'command_name' not in attrs:
                attrs['command_name'] = 'get-' + converted_name
            if 'response_name' not in attrs:
                attrs['response_name'] = converted_name

        # We steal this technique from django; create a class with no
        # attributes, then go through processing the attributes one by
        # one:
        module = attrs.pop('__module__')
        new_class = super(TrikeBaseMeta, cls).__new__(cls, name, bases,
                                                      {'__module__': module})

        # set up field cache.  This maps the json field label (in the
        # subcommands object) to the attribute name:
        fcache = getattr(new_class, '_fields_cache', None)
        if not fcache:
            fcache = {}
        else:
            # If there's an existing cache we still want to clone it
            # so each class in the hierarchy has a copy of just the
            # fields applicable (but including inherited)
            fcache = copy.deepcopy(fcache)
        setattr(new_class, '_fields_cache', fcache)

        tf = cls.__module__ + '.TrikeField'
        for name,val in attrs.iteritems():
            # We need to figure out if this field is a subclass of
            # TrikeField, but TrikeField itself hasn't been seen yet.
            # So, hack around with string comparison:
            bs = [c.__module__ + '.' + c.__name__ for c in val.__class__.__mro__]
            if tf in bs:
                # add name to cache:
                jname = getattr(val, 'json_name', None)
                if not jname:
                    setattr(val, 'json_name', name)
                    jname = name
                fcache[jname] = name
            setattr(new_class, name, val)

        return new_class


class ParamView(collections.MutableMapping):
    """A filter view on the params dict of a trike command.  The filter
    can be specified by either a subset of keys, or by excluding
    commands.
    """

    def __init__(self, params={}, only=None, exclude=None):
        """
        Arguments:
        - `params`: json fragment; should be the params dict of a trike command.
        - `only`: List of keys to restrict access to. Overrides `exclude`.
        - `exclude`: List of keys to block access to. Only has effect if `only` is empty.
        """
        self._params = params
        self._only = only
        self._exclude = exclude

    def set_data(self, data):
        # Note that we explicitly don't do any cloning or anything
        # here; the whole point is that this is just a view on top of
        # the data.
        self._params = data

    def for_client(self):
        return self._params

    def __len__(self):
        l = len(self._params)
        if self._only:
            l = len(self._only)
        elif self._exclude:
            l -= len(self._exclude)
        return max(0, l)

    def __iter__(self):
        if self._only:
            return (nm for nm in self._only)
        elif self._exclude:
            return (nm for nm in self._params if nm not in self._exclude)
        else:
            return iter(self._params)

    def __getitem__(self, key):
        if self._only:
            if key not in self._only:
                raise KeyError(key)
        elif self._exclude:
            if key in self._exclude:
                raise KeyError(key)
        return self._params[key]

    def __setitem__(self, key, val):
        if self._only:
            if key not in self._only:
                raise ValueError('key %s can not be modified or accessed' % key)
        elif self._exclude:
            if key in self._exclude:
                raise ValueError('key %s can not be modified or accessed' % key)
        # Also verify that the key already exists:
        if key not in self._params:
            raise ValueError('Non-existent key %s can not be created' % key)
        self._params[key] = val

    def __delitem__(self, key):
        raise NotImplementedError()


class TrikeBase(object):
    """The base class of all trike command and field classes.

    A class also implements the dict interface (by means of
    delegation); by default this provides easy access to the params
    component of the top-level fragment this class manages.
    """
    __metaclass__ = TrikeBaseMeta

    def __init__(self):
        self._json_data = None
        self._dictImpl = ParamView()

    def _assign_fields_to_fragment(self):
        """Assuming that self._json(?) exists, recursively walk it assigning
        the appropriate bits to fields.  If the fragment is a list,
        provide a list-view of the params, and don't recurse (see
        also, TrikePathField).
        """
        if isinstance(self._json_data, (list, tuple)):
            self._dictImpl = [ParamView(o['params']) for o in self._json_data]
            return

        if 'params' in self._json_data:
            self._dictImpl.set_data(self._json_data['params'])

        if 'subcommands' in self._json_data:
            subs = self._json_data['subcommands']
            for jname, fname in self._fields_cache.iteritems():
                # Note above, if more than one subcommand match they
                # are all passed to the subfield, and will be treated
                # differently.  Note if none match, we by default pass
                # an empty list, which will give null object behaviour
                # in both TrikeField and TrikePathField:
                objs = [obj for obj in subs if obj['command'] == jname]
                field = getattr(self, fname)
                field.set_json(objs[0] if len(objs) == 1 else objs)
                setattr(self, fname, field)

    def set_json(self, json):
        self._json_data = json
        self._assign_fields_to_fragment()

    def get_json(self):
        """Return the unadulterated json fragment maintained by this trike
        object."""
        return self._json_data

    def for_client(self):
        """Abstract method, overridden in both command and field
        implementations.  Returns the subset of json data appropriate
        for client (browser) consumption.
        """
        raise NotImplementedError()

    # dict implementation.  Note that this just defers to an
    # implementation object; we do this rather than use an inheritance
    # mixin because we want to dynamically choose the implementation
    # at times. (although, see
    # http://hyperthese.net/post/python-run-time-mixins/ -- wow)
    def __len__(self): return self._dictImpl.__len__()
    def __iter__(self): return self._dictImpl.__iter__()
    def __getitem__(self, k): return self._dictImpl.__getitem__(k)
    def __setitem__(self, k, v): return self._dictImpl.__getitem__(k, v)
    def __delitem__(self, k): self._dictImpl.__delitem__(k)


class TrikeInvocationException(Exception):
    def __init__(self, msg, detail=''):
        self.message = msg
        self.detail = detail

    def __unicode__(self):
        s = u'Trike Invocation Exception: {0}'.format(self.message)
        if self.detail:
            s = s + u' ({0})'.format(self.detail)
        return s

    def __str__(self):
        return self.__unicode__()


class TrikeCommand(TrikeBase):
    # Class-level variable to determine whether this command should be
    # cached or not.  May be over-ridden in subclasses.  See also
    # `TrikeCommand._get_cache()'.
    _should_cache = False

    def __init__(self):
        super(TrikeCommand, self).__init__()
        for attr in self._fields_cache.itervalues():
            f = getattr(self, attr)
            setattr(self, attr, copy.deepcopy(f))

    def for_client(self):
        '''The subset of document fragment relevant for web clients.  May need
        to be over-ridden by subclasses, for example to customise output for
        backbone.'''
        response = dict((k, self[k]) for k in self )
        for fname in self._fields_cache.itervalues():
            response[fname] = getattr(self, fname).for_client()
        return response

    @classmethod
    def _get_template(cls):
        """Read the template json document associated with this class, and
        return the contents.  The template is expected to have the
        same (unqualified) name as the class, have the extension
        '.tmpl', and be located in a directory called 'reqtemplates'
        which is a sibling of the file containing the class
        definition.
        """
        import os.path as op
        f = inspect.getfile(cls)
        tmpl_name = '%s.tmpl' % cls.__name__
        tmpl_file = op.join(op.dirname(f), 'reqtemplates', tmpl_name)
        with open(tmpl_file) as tf:
            return tf.read()

    @classmethod
    def _get_remote(cls):
        """Return the instance of `apps.webtrike.comms.CommsBase' that this request
        object should use.  Should be implemented by at least the DMF and RCF
        packages separately."""
        raise NotImplementedError()

    @classmethod
    def _get_cache(cls):
        """Return the instance of `apps.webtrike.comms.CommsBase' that this request
        object may choose to use.  Note that this is not the same as
        saying that this request should be cached.  Will probably be
        implemented at the DMF and RCF packages level, but may
        optionally be over-ridden by individual commands as well.
        """
        raise NotImplementedError()

    @classmethod
    def invoke(cls, **params):
        """Invoke this request on the appropriate trike instance, and return
        an instance of the appropriate TrikeResponse object.  If there
        is an error in the request, a `TrikeInvocationException' will
        be raised.
        """
        trike = cls._get_remote()
        js = json.loads(cls._get_template())
        # For robustness(?), we'll allow keyword args to be either
        # CamelCase or underscore_separated, and convert to
        # trike-hyphenated format:
        if 'params' in js:
            jsparams = js['params']
            for k,v in params.iteritems():
                key = convert_name(k).replace('_','-')
                if key not in jsparams:
                    raise ValueError('Non-existent key %s can not be created' % key)
                jsparams[key] = v

        #logger.debug('SUMMARY: {}'.format(json.dumps(js, indent=4)))
        # note sort_keys: trike seems to require this at the moment,
        # or at least require that the command parameter comes first
        # in the stream.  Sorting ensures that keys are in order of
        # command,params,subcommands.
        if cls._should_cache:
            cache_key = json.dumps(js, sort_keys=True).replace(' ','')
            cache = cls._get_cache()
            trike_resp = cache.get(cache_key)
            if not trike_resp:
                logger.debug('No cache entry for {}; will invoke'.
                             format(cache_key))
                trike_resp = trike.invoke(json.dumps(js, sort_keys=True))
                logger.debug('Finished invoke; will cache result')
                cache.set(cache_key, trike_resp)
            else:
                logger.debug('Found cache entry for {}'.format(cache_key))
        else:
            logger.debug('Caching not enabled; will invoke command for {}'.
                         format(cls.__name__))
            trike_resp = trike.invoke(json.dumps(js, sort_keys=True))
            #logger.debug('Finished invoke')
        if 'command' not in trike_resp or trike_resp['command'] == 'error':
            if 'command' in trike_resp:
                params = trike_resp['params']
                msg = params['error-type']
                detail = params['message']
            else:
                msg = 'Malformed response from trike'
                detail = ''
            raise TrikeInvocationException(msg, detail)

        response = cls()
        response.set_json(trike_resp)
        #logger.debug('Invoke returned '+json.dumps(response._json_data))
        return response


class TrikeField(TrikeBase):
    """
    Represents a trike field, which is a top-level member of the
    subcommands dictionary in the associated JSON object.
    """

    def __init__(self, json_name=None):
        super(TrikeField, self).__init__()
        # The actual name in the json structure that this field
        # corresponds to, if different from the attribute name it is
        # assigned to in the TrikeCommand.  (This is because names such
        # as "model-id" are not valid python identifiers, of course)
        self.json_name = json_name

    def __deepcopy__(self, memo):
        cls = self.__class__
        new_inst = cls()
        new_inst.json_name = self.json_name
        for fattr in self._fields_cache.itervalues():
            f = getattr(self, fattr)
            setattr(new_inst, fattr, copy.deepcopy(f))
        return new_inst

    def for_client(self):
        """Implementation for a field.  Returns either a list or an object, as
        appropriate.
        """
        # Note in the following that `self' is a dict implementation
        # (alternatively, a list), so dict comprehensions etc works:
        if isinstance(self._dictImpl, (list, tuple)):
            response = [dict(params) for params in self]
        else:
            response = dict((k,self[k]) for k in self)
            for fname in self._fields_cache.itervalues():
                response[fname] = getattr(self, fname).for_client()
        return response


class PathError(Exception):
    def __init__(self, reason):
        super(PathError, self).__init__()
        self.reason = reason
    def __str__(self):
        return self.reason

class TrikePathField(TrikeField):
    """A field that represents a subsection of a potentially complex json
    document, specified by a JSONPath-like expression.

    A path has the format "name1.name2.name3[1]", where each name is
    the command-name of an object in the subcommands array of the
    current context.  Names may optionally be indexed, from 0, in
    which case it refers to that occurrence if there are multiple
    entries of that command in the array.

    Additionally, the final (and only final) component may be suffixed
    with a '*', meaning all occurrences matching the final command
    name will be set as a list, for example "name1.name2*".  If this
    is the case the field is also indexable, and will provide access
    to the params of the matching subcommand at that position; for
    example fld[2]['model-type'] will access the 'model-type' param
    entry for the 3rd matching subcommand.
    """

    def __init__(self, json_name=None, path=None):
        """
        Arguments:
        - `path`:
        """
        if path is None:
            path = ''
        super(TrikePathField, self).__init__(json_name)
        self._path = path

    def __deepcopy__(self, memo):
        cls = self.__class__
        new_inst = cls(json_name=self.json_name, path=self._path)
        for fattr in self._fields_cache.itervalues():
            f = getattr(self, fattr)
            setattr(new_inst, fattr, copy.deepcopy(f))
        return new_inst

    def set_json(self, json):
        # check for invalid paths first (an array result must be last,
        # and there can be only one):
        if '*' in self._path and self._path.index('*') < len(self._path) - 1:
            raise PathError('Array return specification must be final element (%s)' %
                            self._path)

        try:
            path_components = self._path.split('.')
            obj = json
            idx_re = re.compile(r'([\w-]+)\[(\d+)\]')
            for cmd in path_components:
                if not cmd:
                    continue        # Handles the case where path is ''

                # Prepare for array-return case if applicable:
                ret_array = '*' in cmd
                if ret_array:
                    arr = []
                    cmd = cmd[:-1]  # (we can assume it's valid now)

                idx = 0
                m = idx_re.match(cmd)
                if m:
                    cmd, idx = m.group(1), int(m.group(2))

                if 'subcommands' not in obj:
                    raise PathError('Unable to match path "%s"' % self._path)

                subs = obj['subcommands']
                count = 0
                tmp_obj = None
                for tmp_obj in subs:
                    if tmp_obj['command'] == cmd and ret_array:
                        arr.append(tmp_obj)
                    elif tmp_obj['command'] == cmd and count == idx:
                        break
                    elif tmp_obj['command'] == cmd:
                        count += 1

                if ret_array:
                    if not arr:
                        raise PathError('Unable to match path "%s"' % self._path)
                else:
                    if not tmp_obj or tmp_obj['command'] != cmd or count != idx or \
                       ret_array and not arr:
                        raise PathError('Unable to match path "%s"' % self._path)

                if ret_array:
                    obj = arr
                    # Since this should always be the last component, we
                    # can assign the dict implementation right here:
                    self._dictImpl = [ParamView(o['params']) for o in arr]
                else:
                    obj = tmp_obj

            if isinstance(obj, dict):
                self._dictImpl.set_data(obj['params'])

        except PathError as p:
            if ret_array:
                self._dictImpl = []
            logger.warn('Path error; {}'.format(p))

        self._json_data = obj

class TrikeDerivedField(TrikeField):
    """A read-only field, that provides its value by operating on its
    fragment of json using a user-provided function.  Intended for use
    in views, where it is the easiest way to provide a subset of
    (probably derived) data for use in a Backbone model for example.
    """

    def __init__(self, deriver, json_name=None):
        """
        Arguments:
        - `deriver`: The function that provides a view on this field's
          data: should accept a json (python) data structure, and
          return another.  The returned datastructure must be able to
          implement a basic dict interface (indexing).
        - `json_name`: The name of the json field, if different from
          the field name.
        """
        super(TrikeDerivedField, self).__init__(json_name)
        self._deriver = deriver


    def __deepcopy__(self, memo):
        cls = self.__class__
        new_inst = cls(self._deriver, json_name=self.json_name)
        for fattr in self._fields_cache.itervalues():
            f = getattr(self, fattr)
            setattr(new_inst, fattr, copy.deepcopy(f))
        return new_inst

    def for_client(self):
        return self._dictImpl

    def set_json(self, jsn):
        self._dictImpl = self._deriver(jsn)
