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
from django.core.cache import get_cache
from apps.webtrike.comms import rcf_instance
from apps.webtrike import trike
from apps.webtrike.trike.utils import find_subcmd

import logging
import json
import pprint


logger = logging.getLogger('apps.webtrike.rcf.cmds')


class RCFCommand(trike.TrikeCommand):
    # This should be the default, but for clarity we'll make it
    # explicit here:
    _should_cache = False

    @classmethod
    def _get_remote(cls):
        return rcf_instance()

    @classmethod
    def _get_cache(cls):
        return get_cache('rcf')


class DMFService(RCFCommand):
    command_name = 'get-dmf-service'
    response_name = 'dmf-service'

    _should_cache = True
    _has_dmf_service = False
    _dmf_service_result = None

    @classmethod
    def get_dmf_service(cls):
        if not cls._has_dmf_service:
            response = cls.invoke()
            dr_json = response.get_json()
            if dr_json:
                logger.info("DMF Host: " + dr_json["params"]["host"] + " DMF Port: " + dr_json["params"]["port"])
                cls._dmf_service_result = (dr_json["params"]["host"], int(dr_json["params"]["port"]))
                cls._has_dmf_service = True

        return cls._dmf_service_result

class ServerTime(RCFCommand):
    pass


class CompatibilityMode(RCFCommand):
    pass


class SystemPreferences(RCFCommand):
    pass


class RunGroups(RCFCommand):
    pass


class LoginUserPreferences(RCFCommand):
    pass


class DefaultRun(RCFCommand):
    command_name = 'create-default-run'
    response_name = 'default-run-created'

    # This definitely can be cached; it just returns a template:
    _should_cache = True

    @classmethod
    def all(cls):
        """Utility method to provide access to the list of all available
        models, as Model objects (not the raw json)"""

        response = cls.invoke()
        dr_json = response.get_json()

        # Now, find all the leaf models.  These could be stored some
        # levels deep; the nodes start with model-parameters commands,
        # with branches under SUBMODEL commands.  A leaf is one with no
        # SUBMODEL subcommands (/not/ no subcommands!)
        queue = []
        for o in dr_json["subcommands"]:
            if o['command'] != 'model-parameters':
                continue
            queue.append(o)
        models = []
        while queue:
            candidate = queue.pop(0)
            subs = []
            if 'subcommands' in candidate:
                subs = [m for m in candidate['subcommands'] if m['command'] == 'SUBMODEL']
                if subs:
                    queue += subs
                else:
                    #logger.debug('MODEL: {}'.format(json.dumps(candidate, indent=4)))
                    m = Model()
                    m.set_json(candidate)
                    models.append(m)
        return models


class SystemState(RCFCommand):
    """Access the system status.  This has turned a bit complected; if
    given a selected-run-id argument to invoke then the `status`, 
    `model-parameters` and `run-parameters` fields will be relevant and 
    we capture these in the selectedRun trikepath object.  
    The `summary` field contains the overall summary
    of each run, but the methods of this object are mainly for dealing
    with a specific run.
    """

    _should_cache = False

    selectedRun = trike.TrikePathField(json_name='selected-run-details')


    summary = trike.TrikePathField(json_name='run-summary-status',
                                   path='run-summary*')

    def setup(self):
        #pprint.pprint(vars(self.selectedRun))
        self.status = find_subcmd('status.model-run-status', self.selectedRun._json_data, return_params=False)
        self.modelParams = find_subcmd('run.model-parameters', self.selectedRun._json_data, return_params=False)
        self.runParams = find_subcmd('run.run-parameters', self.selectedRun._json_data, return_params=False)

        return

    def get_model_params(self):
        models = []
        candidate = self.modelParams
        subs = []
        if 'subcommands' in candidate:
          subs = [m for m in candidate['subcommands'] if m['command'] == 'SUBMODEL']
          if subs:
            queue += subs
          else:
            m = Model()
            m.set_json(candidate)
            models.append(m)

        return models

    def not_scheduled(self):
        return True 

    def get_run_params(self):
        return self.runParams['params']

    def is_finished(self):
        params = self.status['params']
        return params['percent-complete'][:3] == '100' and params['state-label']  == 'finished'

    def state(self):
        params = self.status['params']
        return params['state-label']

    def location(self):
        subs = self.status['subcommands']
        output = [o for o in subs if o['command'] == 'output']

        outResp = []
        if output and 'params' in output[0] and '0' in output[0]['params']:
            for k in output[0]['params']:
              outResp.append(output[0]['params'][k])
        return outResp

    def client_summary(self):
        "Simplified results summary, for consumption by a browser"
        resp = []
        import json
        for summary in self.summary._json_data:
            #logger.debug('SIMPLIFIED SUMMARY: {}'.format(json.dumps(summary, indent=4)))
            summaryp = summary['params']
            runid = summaryp['run-id']
            res = {
                'id': runid,
                'name': summaryp['run-name'],
                'modelname': summaryp['model-name'],
                'start': summaryp['simulation-start-time'],
                'stop': summaryp['simulation-stop-time']
            }
            status = find_subcmd('status', summary, return_params=False)
            import json
            #logger.debug('STATUS: {}'.format(json.dumps(status['params'], indent=4)))
            ms = find_subcmd('model-run-status', status, return_params=False)
            msparams = ms['params']
            res['percent'] = msparams.get('percent-complete', 0)
            try:
                res['message'] = msparams.get('state-label')
            except:
                logger.warning("Couldn't find any message for id {}"
                               .format(runid))
                res['message'] = 'Unknown'

            try:
                res['modelstart'] = msparams.get('start-time')[:19]
                res['modelstop'] = msparams.get('stop-time')[:19]
            except:
                logger.warning("Couldn't find start-time/stop-time for id {}"
                               .format(runid))
                res['modelstart'] = '-'
                res['modelstop'] = '-'


            messages = []
            if 'subcommands' in ms:
              subs = ms['subcommands']
              for cmd in subs:
                if cmd['command'] == 'message':
                  messages.append(cmd['params'])

            res['messages'] = messages
            #print 'MESSAGES ',json.dumps(messages)


            resp.append(res)
        return resp


class DataPreferences(RCFCommand):
    pass


class RoughRuntimeEstimate(RCFCommand):
    pass

class DeleteRun(RCFCommand):
    command_name = 'delete-run'
    response_name = 'run-deleted'

class AbortRun(RCFCommand):
    command_name = 'abort-run'
    response_name = 'run-aborted'

class SubmitRun(RCFCommand):
    command_name = 'submit-run'
    response_name = 'run-submitted'


def _extract_vars(forcings):
    """Utility method to extract the list of required variables from the
    "forcings" subcommand format.
    """
    # This process just searches the forcings section for 
    # "requires-model-Y":"X" entries.  We ignore the Y entry and 
    # look at the X format as follows:
    # "data-stream/data-set?:<name,salt><....>".  Here, "data-stream"
    # and "data-set" are variables, but only data-set will be a
    # wild-card which the UI must provide a value for.  
    # The rest (the bits after the ':' enclosed by <..>) are the variable 
    # name(s), description and units.
    params = forcings['params']
    reqvars = []
    uistuff = ''
    providers = []
    varkeys = []
    supportedsets = []
    licensedsets = []

    for k, v in params.iteritems():
        if k.startswith('requires-UI'):
            uistuff = v
            continue
        
        if k.startswith('requires-consolidated-provider'):
            stream, variables = v.split(':')
            splitvars = v.split(',')
            consolidated = { 'stream': stream, 'variables': splitvars }
            providers.append(consolidated)
            continue

        if k.startswith('dataset-parameters-'):
          supportedsets.append(k[19:])

        if k.startswith('licence-'):
          if 'url=' in v:
            sd = dict(u.split("=") for u in v.split(","))
            sd['dataset'] = k[8:]
            sd['accepted'] = True 
            licensedsets.append(sd)
          else:
            licensedsets.append({'dataset': k[8:], 'url': v, 'accepted': False})

        if not k.startswith('requires-model-'):
            continue

        vkey = k[15:]
        varkeys.append(vkey)

        if '?' not in v:
            continue            # If there's no wildcard we can ignore it

        source, decls = v.split(':')
        datastream, dataset = source.split('/') 
        # Now unpack the attribute mappings:
        for decl in decls.split('&'):
            var = {
                'stream': datastream,
                'set': dataset,
                'variable_key': vkey
            }
            for pair in decl[1:-1].split('><'):
                n, v = pair.split(',', 1)
                var[n] = v
            reqvars.append(var)

    # do it again and fill out the dataset of any variables (usually when 
    # this model has already been submitted)
    for k, v in params.iteritems():
            if k in varkeys:
                #print 'found ',k,' with ',v
                source, decls = v.split(':')
                datastream, dataset = source.split('/') 
                # Now place the dataset name into reqvars
                for var in reqvars:
                    if var['variable_key'] == k:
                        var['set'] = dataset


    return { 'requires-UI': uistuff, 'requires-consolidated-provider': providers, 'variables': reqvars, 'supportedsets': supportedsets, 'licensed': licensedsets } 

# Not a true response (there's no corresponding req.Model), but it is
# used to wrap the resultant filtered output from DefaultRun.
class Model(RCFCommand):
    grid = trike.TrikeField()
    forcing = trike.TrikeDerivedField(_extract_vars, json_name='forcings')
    temporalextent = trike.TrikeField(json_name='simulation-period')
    runparams = trike.TrikeField(json_name='parameters-template')
