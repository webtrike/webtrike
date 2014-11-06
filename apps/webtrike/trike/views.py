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
"""Base views for use with Trike commands, providing reasonable
defaults for a REST-like interface (I'm not promising it will actually
be RESTful... it most likely won't be).
"""

from django.http import HttpResponse
from django.views.generic import View
from apps.webtrike.trike import convert_name
import json

class TrikeCommandView(View):
    """Wrap the request-response invocation for a single object.  Any
    parameters for the object should be set in the request arguments
    (We may need to extend this later to cover setting specific fields
    after the model has been created).
    """
    cmd = None
    fieldName = None
    def __init__(self, cmd=None, fieldName=None):
        """Initialise the view for a given model.

        Arguments:
        - `self`:
        - `cmd`: The command class (not instance) to dispatch
          around.
        - `fieldName`: Sometimes there is a single field of interest,
          and the model merely wraps around it.  This optional
          parameter uses that field instead.
        """
        self.cmd = cmd
        self.fieldName = fieldName

    def get(self, request, *args, **kwargs):
        """Over-ridden GET implementation; should not need to be touched.

        Arguments:
        - `self`:
        - `request`: The Django HttpRequest instance.
        - `*args`: Any arguments passed to the command's invoke method.
        - `**kwargs`: Any keyword-arguments, passed to the command's
          invoke method.  Note that trike uses hyphenated parameters
          which aren't valid python, so we use either camelCase or
          underscore_separated variables, which will be converted
          appropriately.
        """
        response = self.cmd.invoke(*args, **kwargs)
        jsn = response.for_client()
        if self.fieldName:
            jsn = jsn[self.fieldName]
        return HttpResponse(json.dumps(jsn), content_type='application/json')
