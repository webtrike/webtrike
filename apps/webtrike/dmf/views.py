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
from collections import defaultdict
from django import http
import apps.webtrike.rcf.cmds as rc
import apps.webtrike.dmf.cmds as dc
import json
import logging

logger = logging.getLogger('apps.webtrike.dmf.views')

def providers_for_model_dummy(request):
    # just a dummy call so that we can make a base url that can be reversed in
    # urls.py
    return http.HttpResponseNotFound()

def providers_for_model(request, name):
    """Return a json-formatted list of providers (data-sets) and the
    variables they provide that are required for that model.

    Arguments:
    - `request`: The django request object.
    - `name`: The model name, assumed unique.
    """

    # Not without a touch of effort.  Find the model (get list of
    # models, find one with matching name), get the list of variables
    # and from those get the set of streams... then for each stream
    # get the list of data-sets.  For each stream/set pairing get the
    # list of provided types, and filter out those not required.

    model = None
    for model in rc.DefaultRun.all():
        if model['name'] == name: # Assumption: model name is unique
            break
            if not model:
                return http.HttpResponseNotFound()

    variables = model.forcing['variables']

    # the variables associated with each stream:
    streamvars = defaultdict(set)
    for v in variables:
        streamvars[v['stream']].add(v['name'])

    # data-sets, keyed by stream name:
    streamsets = {}
    for stream in streamvars:
        ds = dc.DataSets.invoke(data_stream=stream)
        streamsets[stream] = [t.for_client() for t in ds.sets]

    providers = []
    for stream in streamsets:
        for dataset in streamsets[stream]:
            types = dc.DataTypesForDataset.invoke(data_stream=stream, data_set=dataset['name']).types
            dsnames = dict( (t['name'], t) for t in types ) # types indexed by name
            dsnameset = set(dsnames.keys())          # set of names for subset tests

            # Check that at least one variable (including all
            # components of composite variable names) is contained in
            # this dataset
            relevant_types = []
            for varname in streamvars[stream]:
                if varname in dsnames:
                    relevant_types.append(dsnames[varname].for_client())
                elif ',' in varname:
                    # Multiple variable (eg "u,v"); we need to check
                    # that all components are contained in this
                    # dataset:
                    if dsnameset.issuperset(set(varname.split(','))):
                        # We have a match; arbitrarily pick the first
                        # one, and update the name returned to be the
                        # combined name:
                        fakevar = dsnames[varname.split(',')[0]].for_client()
                        fakevar['name'] = varname
                        relevant_types.append(fakevar)

            if relevant_types:
                dataset['variables'] = relevant_types
                dataset['stream'] = stream
                providers.append(dataset)

    return http.HttpResponse(json.dumps(providers), content_type='application/json')

def clear_cache(request):
    get_cache('dmf').clear()

