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
from django.test import TestCase

from apps.webtrike.comms import SocketComms, rcf_instance, dmf_instance


class UtilsTest(TestCase):
    def test_as_json(self):
        """
        Tests that args can be given as strings or python-json
        """
        comms = SocketComms('', '')  # values shouldn't make any difference here
        sdata = '{"test":"dummy"}'
        jdata = {'test': 5}
        self.assertEqual(comms._as_str(sdata), sdata)
        # Note, _as_str uses 4-space indenting:
        self.assertEqual(comms._as_str(jdata), '{\n    "test": 5\n}\n')

    def test_rcf_instance(self):
        "Test that rcf instance is instantiated correctly from settings"
        with self.settings(TRIKE_RCF_INTERFACE='apps.webtrike.comms.SocketComms',
                           TRIKE_RCF_INTERFACE_ARGS=('test-addr', 4242)):
            inst = rcf_instance()
            self.assertIsInstance(inst, SocketComms)
            self.assertEqual(inst._addr, 'test-addr')
            self.assertEqual(inst._port, 4242)
            # Also check that we get the expected errors if we specify
            # something non-existent:
            with self.settings(TRIKE_RCF_INTERFACE='should.not.exist',
                               TRIKE_RCF_INTERFACE_ARGS=('test-addr', 4242)):
                self.assertRaises(Exception, rcf_instance)
                self.assertRaises(ImportError, rcf_instance)

    def test_dmf_instance(self):
        "Test that dmf instance is instantiated correctly from settings"
        with self.settings(TRIKE_DMF_INTERFACE='apps.webtrike.comms.SocketComms',
                           TRIKE_DMF_INTERFACE_ARGS=('test-addr', 4242)):
            inst = dmf_instance()
            self.assertIsInstance(inst, SocketComms)
            self.assertEqual(inst._addr, 'test-addr')
            self.assertEqual(inst._port, 4242)
        # Also check that we get the expected errors if we specify
        # something non-existent:
        with self.settings(TRIKE_DMF_INTERFACE='should.not.exist',
                           TRIKE_DMF_INTERFACE_ARGS=('test-addr', 4242)):
            self.assertRaises(Exception, dmf_instance)
            self.assertRaises(ImportError, dmf_instance)


class SocketCommsTest(TestCase):
    # Handy to know: don't run this test by default, unless explicitly
    # mentioned on the command line (ie, from django, ./manage.py test
    # apps.webtrike.comms.test:SocketCommsTest)
    __test__ = False

    def test_basic_invoke(self):
        "Test invoke() against simple request-responses"
        s = SocketComms('140.79.17.162', 20059)  # blue octa
        jsn = {
            "command": "get-data-streams"
        }
        resp = s.invoke(jsn)
        self.assertIsInstance(resp, dict)  # and not str
        self.assertEqual(resp['command'], 'data-streams')
        self.assertTrue('subcommands' in resp)
