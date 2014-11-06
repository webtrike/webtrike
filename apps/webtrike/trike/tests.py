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
"""
Tests for the base trike framework, including communications and metaclass tests.
"""

from django.test import TestCase

from apps.webtrike.trike import PathError
from apps.webtrike.trike import TrikeCommand
from apps.webtrike.trike import TrikeDerivedField
from apps.webtrike.trike import TrikeField
from apps.webtrike.trike import TrikeBaseMeta
from apps.webtrike.trike import TrikePathField
from apps.webtrike.trike import convert_name

from apps.webtrike.trike.utils import find_subcmd


class MetaclassTest(TestCase):
    def test_name_conversion(self):
        """
        Tests for CamelCase -> camel-case conversion
        """
        self.assertEqual(convert_name('CamelCase'), 'camel-case')
        self.assertEqual(convert_name('Camel'), 'camel')

    def test_attribute_insertion(self):
        # Need to create some test classes here:
        from apps.webtrike.trike import TrikeCommand
        class NoOverride(TrikeCommand):
            pass
        class CommandOverride(TrikeCommand):
            command_name = 'dummy-command'
        class ResponseOverride(TrikeCommand):
            response_name = 'dummy-response'

        # base case:
        self.assertEqual(NoOverride.command_name, 'get-no-override')
        self.assertEqual(NoOverride.response_name, 'no-override')

        # command override:
        self.assertEqual(CommandOverride.command_name, 'dummy-command')
        self.assertEqual(CommandOverride.response_name, 'command-override')

        # response override:
        self.assertEqual(ResponseOverride.command_name, 'get-response-override')
        self.assertEqual(ResponseOverride.response_name, 'dummy-response')

    def test_cache_creation(self):
        class DummyField(TrikeField):
            pass
        class Model(TrikeCommand):
            cnt = 1             # not TrikeField, shouldn't be in cache.
            fld = DummyField()  # TrikeField, should be in cache.
        m = Model()
        fc = m._fields_cache
        self.assertIsNotNone(fc)
        self.assertIn('fld', fc)
        self.assertNotIn('cnt', fc)
        self.assertEqual(len(fc), 1)

        # Test that properties are inherited correctly
        class SecondModel(Model):
            fld2 = DummyField()
        sm = SecondModel()
        fc2 = sm._fields_cache
        self.assertIsNotNone(fc2)
        self.assertIn('fld', fc2)
        self.assertIn('fld2', fc2)
        self.assertNotIn('cnt', fc2)
        self.assertEqual(len(fc2), 2)

        # Finally, check that the caches are independent:
        self.assertNotEquals(fc, fc2)

    def test_field_recreation(self):
        """The metaclass does delayed instantiation of fields, so we test that
        they are re-inserted correctly."""
        class DummyField(TrikeField):
            pass
        class Model(TrikeCommand):
            cnt = 1             # not TrikeField, shouldn't be in cache.
            fld = DummyField()  # TrikeField, should be in cache.
        # First, check for the fields themselves:
        m = Model()
        self.assertEqual(m.cnt, 1)
        self.assertIsInstance(m.fld, DummyField)
        # check it's an instance, not a class still
        self.assertNotIsInstance(m.fld, TrikeBaseMeta)

        # Now, check that we have independent instances created; ie
        # that changing one is transparent to a second instance:
        m2 = Model()
        self.assertEqual(m.cnt, 1)
        self.assertEqual(m2.cnt, 1)
        m.cnt = 2
        self.assertEqual(m.cnt, 2)
        self.assertEqual(m2.cnt, 1)

        # and similarly that we have different field instances:
        self.assertNotEqual(id(m.fld), id(m2.fld))

    def test_deep_field_recreation(self):
        class DummyField(TrikeField):
            pass
        class DeepField(TrikeField):
            d = DummyField()
        class Model(TrikeCommand):
            fld = DeepField()
        m1 = Model()
        m2 = Model()
        self.assertNotEquals(id(m1.fld), id(m2.fld))
        self.assertNotEquals(id(m1.fld.d), id(m2.fld.d))

from apps.webtrike.trike import ParamView

class ParamViewTest(TestCase):
    def test_len(self):
        # First just the pass-through case:
        self.assertEqual(len(ParamView({})), 0)
        self.assertEqual(len(ParamView({'a':'aa', 'b':'bb'})), 2)

        # Now the 'only' case:
        p = ParamView({'a':'aa', 'b':'bb'}, only=('a',))
        self.assertEqual(len(p), 1)

        # and the 'exclude' case:
        p = ParamView({'a':'aa', 'b':'bb', 'c':'cc'}, exclude=('b',))
        self.assertEqual(len(p), 2)

        # finally, check that only over-rides exclude:
        p = ParamView({'a':'aa', 'b':'bb', 'c':'cc', 'd':'dd'},
                      only=('a', 'b'), exclude=('b',))
        self.assertEqual(len(p), 2)

    def test_iter(self):
        # (not really worried about __iter__ too much)

        # pass-through:
        p = ParamView({'a':'aa', 'b':'bb'})
        self.assertEqual(list(p), ['a', 'b'])
        self.assertNotEqual(list(p), ['a', 'c'])

        # 'only' case:
        p = ParamView({'a':'aa', 'b':'bb'}, only=('a',))
        self.assertEqual(list(p), ['a'])

        # 'exclude' case:
        p = ParamView({'a':'aa', 'b':'bb', 'c':'cc'}, exclude=('b',))
        self.assertEqual(list(p), ['a', 'c'])

        # combined case; 'only'  overrides 'exclude':
        p = ParamView({'a':'aa', 'b':'bb', 'c':'cc', 'd':'dd'},
                      only=('a', 'b'), exclude=('b',))
        self.assertEqual(list(p), ['a', 'b'])

    def test_get(self):
        # pass-through:
        p = ParamView({'a':'aa'})
        self.assertEqual(p['a'], 'aa')
        self.assertRaises(KeyError, p.__getitem__, 'b')

        # 'only' case:
        p = ParamView({'a':'aa', 'b':'bb'}, only=('a',))
        self.assertEqual(p['a'], 'aa')
        self.assertRaises(KeyError, p.__getitem__, 'b')

        # 'exclude' case:
        p = ParamView({'a':'aa', 'b':'bb'}, exclude=('a',))
        self.assertEqual(p['b'], 'bb')
        self.assertRaises(KeyError, p.__getitem__, 'a')

        # combined case; 'only'  overrides 'exclude':
        p = ParamView({'a':'aa', 'b':'bb', 'c':'cc', 'd':'dd'},
                      only=('a', 'b'), exclude=('b',))
        self.assertEqual(p['a'], 'aa')
        self.assertEqual(p['b'], 'bb')
        self.assertRaises(KeyError, p.__getitem__, 'c')
        self.assertRaises(KeyError, p.__getitem__, 'd')

    def test_set(self):
        # pass-through:
        p = ParamView({'a':'aa'})
        self.assertEqual(p['a'], 'aa')
        p['a'] = 'aaa'
        self.assertEqual(p['a'], 'aaa')
        self.assertRaises(KeyError, p.__getitem__, 'b')
        self.assertRaises(ValueError, p.__setitem__, 'b', 'bb')

        # 'only' case:
        p = ParamView({'a':'aa', 'b':'bb'}, only=('a',))
        self.assertEqual(p['a'], 'aa')
        p['a'] = 'aaa'
        self.assertEqual(p['a'], 'aaa')
        self.assertRaises(ValueError, p.__setitem__, 'b', 'bb')

        # 'exclude' case:
        p = ParamView({'a':'aa', 'b':'bb'}, exclude=('a',))
        self.assertEqual(p['b'], 'bb')
        p['b'] = 'bbb'
        self.assertEqual(p['b'], 'bbb')
        self.assertRaises(ValueError, p.__setitem__, 'a', 'aa')
        self.assertRaises(ValueError, p.__setitem__, 'c', 'cc')

        # combined case; 'only'  overrides 'exclude':
        p = ParamView({'a':'aa', 'b':'bb', 'c':'cc', 'd':'dd'},
                      only=('a', 'b'), exclude=('b',))
        self.assertEqual(p['a'], 'aa')
        p['a'] = 'aaa'
        self.assertEqual(p['a'], 'aaa')
        self.assertEqual(p['b'], 'bb')
        p['b'] = 'bbb'
        self.assertEqual(p['b'], 'bbb')
        self.assertRaises(ValueError, p.__setitem__, 'c', 'ccc')

    def test_del(self):
        p = ParamView({})
        self.assertRaises(NotImplementedError, p.__delitem__, 'a')

class PathFieldTest(TestCase):
    "Tests for the path-parsing of TrikePathField"

    def test_identity_case(self):
        "Test that a path of '' doesn't recurse at all"
        js = {
            'command':'name1',
            'params':{},
            'subcommands':[{
                'command':'name2', 'params':{}, 'subcommands':[]
            }]
        }
        pth = ''
        fld = TrikePathField('name1', pth)
        fld.set_json(js)
        self.assertEqual(fld._json_data, js)

    def test_simple_paths(self):
        "Test paths just of the form 'name.name.name...'"
        # depth 1:
        js = {
            'command':'name1',
            'params':{},
            'subcommands':[{
                'command':'name2', 'params':{}, 'subcommands':[]
            }]
        }
        pth = 'name2'
        fld = TrikePathField('name1', pth)
        fld.set_json(js)
        self.assertEqual(fld._json_data, {
            'command':'name2', 'params':{}, 'subcommands':[]
        })

        # Another, when it's not the first in subcommands:
        js = {
            'command':'name1',
            'params':{},
            'subcommands':[
                {'command':'name3', 'params':{'a':1}, 'subcommands':[] },
                {'command':'name2', 'params':{'b':2}, 'subcommands':[] }
            ]
        }
        pth = 'name2'
        fld = TrikePathField('name1', pth)
        fld.set_json(js)
        self.assertEqual(fld._json_data, {
            'command':'name2', 'params':{'b':2}, 'subcommands':[]
        })

        # depth 2:
        js = {
            'command':'name1',
            'params':{},
            'subcommands':[
                {'command':'name2', 'params':{}, 'subcommands':[]},
                {'command':'name3', 'params':{}, 'subcommands':[
                    {'command':'name4', 'params':{}, 'subcommands':[]},
                ]}
            ]
        }
        pth = 'name3.name4'
        fld = TrikePathField('name1', pth)
        fld.set_json(js)
        self.assertEqual(fld._json_data, {
            'command':'name4', 'params':{}, 'subcommands':[]
        })

    def test_indexed_paths(self):
        "Test paths with an array index; eg 'name.name[2].name'"

        js = {
            'command':'name1',
            'params':{},
            'subcommands':[{
                'command':'name2', 'params':{}, 'subcommands':[
                    {'command':'name3', 'params':{}, 'subcommands':[]},
                    {'command':'name2', 'params':{}, 'subcommands':[]},
                    {'command':'name3', 'params':{}, 'subcommands':[
                        {'command':'name5', 'params':{}, 'subcommands':[]},
                        {'command':'name6', 'params':{}, 'subcommands':[]},
                    ]},
                ]
            }]
        }
        pth = 'name2.name3[1].name6'
        fld = TrikePathField('name1', pth)
        fld.set_json(js)
        self.assertEqual(fld._json_data, {
            'command':'name6', 'params':{}, 'subcommands':[]
        })

    def test_iterable_result(self):
        "Test that an array can be returned from a query"
        # Test basic case:
        js = {
            'command':'name1',
            'params':{},
            'subcommands':[{
                'command':'name2', 'params':{}, 'subcommands':[
                    {'command':'name3', 'params':{'p':'p0'}, 'subcommands':[]},
                    {'command':'name2', 'params':{}, 'subcommands':[]},
                    {'command':'name3', 'params':{'p':'p1'}, 'subcommands':[
                        {'command':'name5', 'params':{}, 'subcommands':[]},
                        {'command':'name6', 'params':{}, 'subcommands':[]},
                    ]},
                ]
            }]
        }
        pth = 'name2.name3*'
        fld = TrikePathField('name1', pth)
        fld.set_json(js)
        self.assertEqual(fld._json_data, [
            {'command':'name3', 'params':{'p':'p0'}, 'subcommands':[]},
            {'command':'name3', 'params':{'p':'p1'}, 'subcommands':[
                {'command':'name5', 'params':{}, 'subcommands':[]},
                {'command':'name6', 'params':{}, 'subcommands':[]}
            ]},
        ])
        # check the dict interface too:
        self.assertEqual(fld[0]['p'], 'p0')
        self.assertEqual(fld[1]['p'], 'p1')
        self.assertEqual(len(fld), 2)

        # Test that a singular element is still returned as an array:
        js = {
            'command':'name1',
            'params':{},
            'subcommands':[
                {'command':'name2', 'params':{}, 'subcommands':[]},
                {'command':'name3', 'params':{}, 'subcommands':[
                    {'command':'name4', 'params':{}, 'subcommands':[]},
                ]}
            ]
        }
        pth = 'name2*'
        fld = TrikePathField('name1', pth)
        fld.set_json(js)
        self.assertEqual(fld._json_data, [
            {'command':'name2', 'params':{}, 'subcommands':[]}
        ])

        # Test that no matches is just the empty array:
        js = {
            'command':'name1',
            'params':{},
            'subcommands':[
                {'command':'name2', 'params':{}, 'subcommands':[]}
            ]
        }
        pth = 'name3*'
        fld = TrikePathField('name1', pth)
        fld.set_json(js)
        self.assertEqual(len(fld), 0)

        # test that invalid paths raise an error:
        fld = TrikePathField('dummy', 'name1*.name2')
        self.assertRaises(PathError, fld.set_json, {})
        fld = TrikePathField('dummy', 'name1*.name2*')
        self.assertRaises(PathError, fld.set_json, {})
        fld = TrikePathField('dummy', 'name*1') # check off-by-one:
        self.assertRaises(PathError, fld.set_json, {})

    def test_invalid_path(self):
        "Check for a path that doesn't exist (should provide a null-field)"

        # First, an empty path:
        js = {
            'command':'name1',
            'params':{},
            'subcommands':[]
        }
        pth = 'name3'
        fld = TrikePathField('name1', pth)
        fld.set_json(js)
        self.assertEqual(len(fld), 0)

        # Same, but with some data in place:
        js = {
            'command':'name1',
            'params':{},
            'subcommands':[
                {'command':'name2', 'params':{}, 'subcommands':[]},
                {'command':'name3', 'params':{}, 'subcommands':[
                    {'command':'name4', 'params':{}, 'subcommands':[]},
                ]}
            ]
        }
        pth = 'name4'
        fld = TrikePathField('name1', pth)
        fld.set_json(js)
        self.assertEqual(len(fld), 0)

class JsonTests(TestCase):
    """Breaking with the theme of the others; test a single method
    (set_json) across multiple implementations.
    """

    def test_model_json(self):
        "Test the json generated by a Model instance."
        jsn = {
            'command': 'dummy',
            'params': {
                'id': '1'
            },
            'subcommands': [
                {'command':'sub1', 'params':{'p':'q'}},
                {'command':'sub2'}
            ]
        }
        # Check a bare model with no fields
        m = TrikeCommand()
        m.set_json(jsn)
        self.assertEqual(m.for_client(), {'id':'1'})

        # Check a model with some declared fields
        class FM(TrikeCommand):
            sub1 = TrikeField()
        m = FM()
        m.set_json(jsn)
        self.assertEqual(m.for_client(), {'id':'1', 'sub1':{'p':'q'}})

    def test_field_json(self):
        "Test the json generated by a Field instance"
        # Test a basic field
        jsn = {
            'command': 'dummy',
            'params': {
                'id': '1'
            },
            'subcommands': [
                {'command':'sub1', 'params':{'p':'q'}},
                {'command':'sub2'}
            ]
        }
        f = TrikeField()
        f.set_json(jsn)
        self.assertEqual(f.for_client(), {'id':'1'})

        # Test a list field
        jsn = [
            {'command':'dummy', 'params':{'a':'1'}},
            {'command':'dummy', 'params':{'b':'2'},
             'subcommands':[{'command':'shouldnotappear'}]}
        ]
        f = TrikeField()
        f.set_json(jsn)
        self.assertEqual(f.for_client(), [{'a':'1'}, {'b':'2'}])

    def test_derived_field(self):
        "Test the json generated by a TrikeDerivedField instance"
        ks = lambda j: list(iter(j['params']))
        f = TrikeDerivedField(ks)
        jsn = {
            'command':'dummy',
            'params': {
                'p1': 'ignored',
                'p2': 'ignored'
            }
        }
        f.set_json(jsn)
        # Sort, because key iteration order isn't guaranteed:
        self.assertEqual(sorted(f.for_client()), ['p1', 'p2'])


class UtilsTests(TestCase):
    def test_find_subcmd(self):
        "Test the find_subcmd utility."

        # Note the repeated 'c2' subcommand; we always assume the first one
        jsn = {
            'command': 'c1',
            'params': {'c1p1': 'dummy'},
            'subcommands': [{
                'command': 'c2',
                'params': {'c2p1': 'dummy'},
                'subcommands': [{
                    'command': 'c3',
                    'params': {'c3p1': 'dummy'}
                }]
            }, {
                'command': 'c2',
                'params': {'c2p2': 'dummy'},
                'subcommands': []
            }, {
                'command': 'c4',
                'params': {'c4p1': 'dummy'},
            }]
        }

        # single-level path:
        ret = find_subcmd('c2', jsn)
        self.assertEqual(ret, {'c2p1': 'dummy'})
        # dotted path:
        ret = find_subcmd('c2.c3', jsn)
        self.assertEqual(ret, {'c3p1': 'dummy'})

        # test return of whole object (otherwise defaults to just params):
        ret = find_subcmd('c2.c3', jsn, False)
        self.assertEqual(ret, {
            'command': 'c3',
            'params': {'c3p1': 'dummy'}
        })

        # Test that errors are raised where expected:
        self.assertRaises(Exception, find_subcmd, 'c5', jsn)
        self.assertRaises(Exception, find_subcmd, 'c2.c4', jsn)
