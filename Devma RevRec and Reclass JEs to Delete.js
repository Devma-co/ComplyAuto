/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */


define(['N/runtime', 'N/record', 'N/search', 'N/task', 'N/format'],

    function (runtime, record, search, task, format) {

        /**
         * Definition of the Scheduled script trigger point.
         *
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
         * @Since 2015.2
         */

        /**
        * Reschedules the current script and returns the ID of the reschedule task
        */
        function rescheduleCurrentScript(paramobj) {
            var scheduledScriptTask = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT
            });
            scheduledScriptTask.scriptId = runtime.getCurrentScript().id;
            scheduledScriptTask.deploymentId = runtime.getCurrentScript().deploymentId;
            scheduledScriptTask.params = paramobj;
            scheduledScriptTask.submit();
        }


        function execute(scriptContext) {
            try {

                var scriptObj = runtime.getCurrentScript();
			    var ssID = '1590';
                if(ssID != null && ssID != ''){
                var tranSS = search.load({ id: ssID });
                var ssType = tranSS.searchType;
                var ssFilters = tranSS.filters;
                var ssColumns = tranSS.columns;
                var journalSearchResults = getSearchResults(ssType, ssFilters, ssColumns)

                if (journalSearchResults != null && journalSearchResults != '' && journalSearchResults.length > 0) {
                    log.debug('journalSearchResults', journalSearchResults.length)
                    for (var c = 0; c < journalSearchResults.length; c++) {
                        var recId = journalSearchResults[c].getValue({
         name: "internalid",
         summary: "GROUP",
         label: "Internal ID"
      });
                        log.debug('recId', recId)
                        var journalRecord = record.delete({
                            type: 'journalentry',
                            id: recId,
                        });
                     // break;
                    }
                }
              }
            } catch (e) {
                log.debug('error', e)
            }

        }

        return {
            execute: execute //sets the loop again until looping variable = 0
        };


        function getSearchResults(rectype, fils, cols) {
            var mySearch = search.create({
                type: rectype,
                columns: cols,
                filters: fils
            });
            var resultsList = [];
            var myPagedData = mySearch.runPaged({ pageSize: 1000 });
            myPagedData.pageRanges.forEach(function (pageRange) {
                var myPage = myPagedData.fetch({ index: pageRange.index });
                myPage.data.forEach(function (result) {
                    resultsList.push(result);
                });
            });
            return resultsList;
        }
    });