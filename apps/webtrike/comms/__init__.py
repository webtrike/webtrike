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
"""Contains the interface for communicating with Trike instances, and
optionally automatically obtaining the correct interface.
"""

from django.conf import settings
import json
import logging
import socket

logger = logging.getLogger('apps.webtrike.comms')


def _import_cls(fqn, args):
    modnm, clsnm = fqn.rsplit('.', 1)
    mod = __import__(modnm, fromlist=[clsnm])
    cls = getattr(mod, clsnm)
    inst = cls(*args)
    return inst


def rcf_instance():
    try:
        fqn  = settings.TRIKE_RCF_INTERFACE  # string; fully-qualified name to import
        args = settings.TRIKE_RCF_INTERFACE_ARGS  # args to instantiate that instance with

        return _import_cls(fqn, args)
    except:
        import logging
        logging.critical('Unable to instantiate Trike RCF connection!!')
        raise


def dmf_instance():
    try:
        import apps.webtrike.rcf.cmds as rc
        response = None

        response = rc.DMFService().get_dmf_service()

        if response:
            fqn  = settings.TRIKE_DMF_INTERFACE
            args = response

        else:
            fqn  = settings.TRIKE_DMF_INTERFACE  # string; fully-qualified name to import
            args = settings.TRIKE_DMF_INTERFACE_ARGS  # args to instantiate that instance with

        return _import_cls(fqn, args)
    except:
        import logging
        logging.critical('Unable to instantiate Trike DMF connection!!')
        raise


class CommsBase(object):
    """Base class for communication with Trike instances.

    This will generally be over a socket, but we abstract it here for
    testing purposes, and in case things change in the future.  This
    also means it's a pretty trivial interface at this point, but
    might be extended to handle asynchrony, et.
    """

    def invoke(self, json):
        """Invoke Trike with the specified json fragment (assumed to be a valid trike document)
        Returns the json response from Trike, as parsed json (ie, a python data structure).
        Arguments:
        - `self`:
        - `json`: The Trike command object.  May either be a string or a python map representing json.
        """
        raise NotImplementedError("Must be over-ridden in a subclass")


class SocketComms(CommsBase):
    """The standard socket connection interface for Trike.
    """

    def __init__(self, addr, port):
        """
        Arguments:
        - `addr`: The address of the trike instance, as a dotted-quad string.
        - `port`: The port of the trike interface.
        """
        self._addr = addr
        self._port = port

    def invoke(self, jsn):
        response = ''
        sock = None
        try:
            # we'll be explicit about the defaults
            logger.debug('Will send to trike '+self._as_str(jsn))
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect((self._addr, self._port))
            logger.debug('Will send to trike now')
            sock.sendall(self._as_str(jsn))
            logger.debug('Finished send; will shutdown writes and wait for response')
            sock.shutdown(socket.SHUT_WR)  # Trike needs this!
            while True:
                data = sock.recv(4096)
                if not data:
                    break
                response += data
            logger.debug('Finished receiving data from trike; will close and return')
            #logger.debug('Response was '+response)
            if response == '':
              logger.debug('response was empty!')
              response = '{}'
        finally:
            if sock != None:
              sock.close()
        return json.loads(response)

    def _as_str(self, jsn):
        """Returns a json object as a string; the input may either be a
        string, returned untouched, or a valid json map which is
        serialised.
        """
        if isinstance(jsn, (str, unicode)):
            logger.debug('Argument is already a string; pass-through untouched')
            return jsn
        else:
            logger.debug('Received json argument; will serialise to string')
            return json.dumps(jsn, indent=4, sort_keys=True) + '\n'


class LookupMockComms(CommsBase):
    """Pretend to be a Comms class for offline testing purposes, using
    canned responses just looking up the command name.
    """

    def __init__(self, filename):
        """
        Arguments:
        - `filename`: the filename to use for responses. The file
          should contain a json-formatted object, whose keys are the
          command names, and the values are the response objects.  The
          filename should be a relative path.
        """
        # Load the dictionary:
        import inspect
        import os.path as op
        f = inspect.getfile(self.__class__)
        json_file = op.join(op.dirname(f), 'respmaps', filename)
        with open(json_file) as jf:
            self.response_dict = json.loads(jf.read())

    def _as_json(self, s):
        """Return an object as json (ie, a python dict): input can be either a
        string to be parsed, or a map which is just returned unaltered"""
        if isinstance(s, (list, dict)):
            return s
        else:
            return json.loads(s)

    def invoke(self, jsn):
        jsn = self._as_json(jsn)
        cmd = jsn['command']
        return self.response_dict[cmd]
