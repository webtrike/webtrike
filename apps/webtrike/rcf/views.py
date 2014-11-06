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
from django import http
from django.conf import settings
from django.views.generic.base import View

from apps.webtrike.comms import rcf_instance
from apps.webtrike.trike.utils import find_subcmd
import apps.webtrike.rcf.cmds as rc

import datetime as dt
import json
import logging
import os.path as op
import os
import re
import shutil
import pprint



logger = logging.getLogger('apps.webtrike.rcf.views')

def available_models(request):
    """Return a json-formatted list of available models.

    Arguments:
    - `request`: The django request object.
    """
    models = rc.DefaultRun().all()
    #for m in models:
    # print 'CRAP ',json.dumps(m.for_client(),indent=4)

    """return http.HttpResponse(json.dumps([m.for_client() for m in models if len(m.for_client()['variables']) != 0]),content_type='application/json')"""
    return http.HttpResponse(json.dumps([m.for_client() for m in models if 'workflow' in m and m['workflow'] == 'true']),content_type='application/json')


class ManageRuns(View):
    """Create, delete, view and abort runs.  Note, these are API methods, 
    not intended to be human-readable views."""

    def get(self, request):
        """Get a summary list of all available runs.

        TODO: take an optional argument to get the status of an
        individual run? Ie, merge in run_status below?
        """
        resp = []
        try:
            status = rc.SystemState.invoke()
            resp = status.client_summary()
        except Exception as e:
            import traceback; traceback.print_exc()
            logger.error('Error getting system status: {}'.format(e))

        return http.HttpResponse(json.dumps(resp),
                                 content_type='application/json')

    def post(self, request):
        data = request.body         # note, not the request.POST dictionary
        data = json.loads(data)

        if 'operation' in data:
          if data['operation'] == 'delete':
            for runid in data['runids']:
              deleterun = {
                'command': 'delete-run',
                'params': {
                    'run-id': runid 
                }
              }
              comms = rcf_instance()
              deleted = comms.invoke(deleterun)
  
            return http.HttpResponse(json.dumps(deleted, sort_keys=True),
                                 content_type='application/json')

          elif data['operation'] == 'abort':
            for runid in data['runids']:
              abortrun = {
                'command': 'abort-run',
                'params': {
                    'run-id': runid 
                }
              }
              comms = rcf_instance()
              aborted = comms.invoke(abortrun)

  
            return http.HttpResponse(json.dumps(aborted, sort_keys=True),
                                 content_type='application/json')

        else:
          """Send off a submit-run request, and return the id for tracking
          purposes."""
          # Find the default model that matches the one we've been sent
          mdl = None
          for m in rc.DefaultRun.all():
            if m['name'] == data['name']:
              mdl = m
  
          if mdl == None:
            return http.HttpResponse(json.dumps({'runid': '-1', 'error': 'Could not find default model type for '+data['name']}, sort_keys=True), content_type='application/json')

          mdljson = mdl._json_data

          params = mdljson['params']

          # basic data:
          nowtime = dt.datetime.now().isoformat()
          runname = data['run-name']
          rundesc = data['run-name']+' run at '+nowtime
          params['name'] = runname 
          params['description'] = rundesc
  
          start, end = data['start-time'], data['end-time']
          params['base-date'] = start
  
          period = find_subcmd('simulation-period', mdljson)
          period['stop-time'] = end

          grid = find_subcmd('grid', mdljson)
          dg = data['grid']
          for k in dg:
            grid[k] = dg[k]

          variables = data['forcing']['variables']
          licenses = data['forcing']['licensed']
          forcings = find_subcmd('forcings', mdljson)
          #print 'VARS   ',json.dumps(variables,indent=2,sort_keys=True)
          #print 'BEFORE ',json.dumps(forcings,indent=2,sort_keys=True)
          varkeys = {}
          datasetparams = {}
          licensedds = {}
          datatypes = {}
          namere = re.compile(r'<name,([^>]+)>')
          for k, v in forcings.iteritems():
            if 'requires-model-' in k and '?' in v:
                # can be more than one <name,..> group in this
                nm = namere.search(v)
                grps = ','.join(namere.findall(v))
                nm = nm.group(1)
                varkeys[nm] = k[15:] 
                datatypes[k[15:]] = grps
            elif 'dataset-parameters-' in k:
                ds = k[19:]
                datasetparams[ds] = v 
            elif 'licence-' in k:
                ds = k[8:]
                licensedds[ds] = v # not really used but we might

          for v in variables:
            vname = v['name']
            vset = v['set']
            vstream = v['stream']
            #vdatatype = v['name']
            if vname in varkeys:
                if vset in datasetparams:
                   mappings = vstream+'/'+vset+':'+datasetparams[vset]+'<datatypes,'+datatypes[varkeys[vname]]+'>'
                   forcings[varkeys[vname]] = mappings
                else:
                   print "ERROR: Could not find dataset parameters for dataset ",vset
            else: 
                print "ERROR: Could not find variable name ",vname

          for d in licenses:
            dset = d['dataset']
            if d['accepted']:
              value = 'username='+d['username']+',email='+d['email']+',when='+d['when']+',url='+d['url']+',ipaddress='+d['ipaddress']
              if dset in licensedds:
                forcings['licence-'+dset] = value
              else: 
                print "ERROR: Could not find licensed dataset ",dset," to assign key ",value

          #print 'AFTER ',json.dumps(forcings,indent=2,sort_keys=True)

          # Now hack in to the form required (hardcoding here too XXX):
          mdljson['command'] = "model-parameters"
          submitrun = {
            'command': 'submit-run',
            'params': {
                'run-group-id': '1'
            },
            'subcommands': [{
                "command": "run-parameters",
                "params": {
                    "run-name": runname,
                    "description": rundesc,
                    "scheduling": "immediate",
                    "scheduled-start-time": dt.datetime.now().strftime('%Y-%M-%d %H:%M:%S'),
                    "priority": "medium",
                    "auto-repeat": "false",
                    "auto-repeat-interval": "0.0",
                    "privileges": "9223372036854775807",
                    "runId": "-1",
                    "user_id": "-1",
                    "runGroupId": "-1",
                    "rapid-progression": "false"
                }
            },
            mdljson]
          }
          comms = rcf_instance()
          submitted = comms.invoke(submitrun)
  
          runid = submitted['params']['run-id']
  
          return http.HttpResponse(json.dumps({'runid': runid}, sort_keys=True),
                                 content_type='application/json')

def clear_cache(request):
    get_cache('rcf').clear()

def run_status(request, runid):
    """Request the status of a given run.  Will include the download
    location when the extraction has finished."""
    if request.method != 'GET':
        return http.HttpResponseNotAllowed(['GET'])

    resp = {
        'runid': runid,
    }

    try:
      status = rc.SystemState.invoke(selected_run_id=runid)
      status.setup()

      resp['status'] = status.state()
      resp['message'] = ''
      resp['url'] = []

      outs = []

      if status.is_finished():
        loc = status.location()
        #print 'FILE(s) to download ',loc
        # make sure we have a location
        if len(loc) > 0:
           for fullFname in loc:
              fname = op.basename(fullFname)
              newloc = op.join(settings.MEDIA_ROOT, fname)
              #print 'FILE ',fname,'  :  ',newloc,' : ',fullFname
              if not op.exists(fullFname):
                resp['status'] = 'error'
                resp['message'] = 'Cannot access/find output file '+fullFname
              else:
                if not op.exists(newloc):
                  os.symlink(fullFname, newloc)
                outs.append(settings.MEDIA_URL + fname)

                resp['url'] = outs
        else:
           resp['status'] = 'error'
           resp['message'] = 'Cannot find output file in trike model run'
    
    except Exception as e:
        print 'Exception ',str(e)
        resp['status'] = 'error'
        resp['message'] = str(e)
   

    # get model-parameters
    models = status.get_model_params()
    resp['modelparameters'] = models.pop(0).for_client()

    # get run-params
    runparams = status.get_run_params()
    resp['runparameters'] = runparams

    return http.HttpResponse(json.dumps(resp), content_type='application/json')
