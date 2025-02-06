/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/log', 'N/format'], function(record, search, log, format) {

    function getInputData() {
      var revenueelementSearchObj = search.create({
   type: "revenueelement",
   filters:
   [
     [["revrecstartdate","isempty",""],"OR",["revrecenddate","isempty",""]], 
      "AND", 
      ["item","noneof","219","5","220","228"], 
      "AND", 
      ["sourcetransaction.custcol_atlas_contract_start_date","isnotempty",""]
   ],
   columns:
   [
      search.createColumn({
         name: "internalid",
         join: "revenueArrangement",
         label: "RevArr: Internal ID"
      }),
      search.createColumn({name: "internalid", label: "RevElement: Internal ID"}),
      search.createColumn({name: "recordnumber", label: "Number"}),
      search.createColumn({name: "source", label: "Source"}),
      search.createColumn({name: "entity", label: "Customer"}),
      search.createColumn({name: "item", label: "Item"}),
      search.createColumn({name: "revenuerecognitionrule", label: "Revenue Recognition Rule"}),
      search.createColumn({name: "revrecforecastrule", label: "Rev Rec Forecast Rule"}),
      search.createColumn({name: "revrecstartdate", label: "Start Date"}),
      search.createColumn({name: "forecaststartdate", label: "Forecast Start Date"}),
      search.createColumn({name: "revrecenddate", label: "End Date"}),
      search.createColumn({name: "forecastenddate", label: "Forecast End Date"}),
      search.createColumn({
         name: "custcol_atlas_contract_start_date",
         join: "sourceTransaction",
         label: "Source: Term Start Date"
      }),
      search.createColumn({
         name: "custcol_atlas_contract_end_date",
         join: "sourceTransaction",
         label: "Source: Term End Date"
      }),
      search.createColumn({name: "revenuerecognitionrule", label: "Revenue Recognition Rule"})
   ]
});
        return revenueelementSearchObj;
    }

    function map(context) {
        var searchResult = JSON.parse(context.value);
        log.debug('searchResult', JSON.stringify(searchResult));

        // Extract numeric ID from the Revenue Arrangement field value
        var revenueArrangementId = searchResult.values['revenuearrangement'];
        var revenueElementId = searchResult.id;
       var sourceStartDate = searchResult.values['custcol_atlas_contract_start_date.sourceTransaction'];
        var sourceEndDate = searchResult.values['custcol_atlas_contract_end_date.sourceTransaction'];
      log.debug('sourceStartDate',sourceStartDate)
       log.debug('sourceEndDate',sourceEndDate)

       if (revenueElementId && sourceStartDate && sourceEndDate) {
            try {
                sourceStartDate = format.parse({
                    value: sourceStartDate,
                    type: format.Type.DATE
                });
                sourceEndDate = format.parse({
                    value: sourceEndDate,
                    type: format.Type.DATE
                });
                  var revRec = record.load({
                    type: 'revenueelement',
                    id: revenueElementId,
                    isDynamic: false
                });
              var revenueArrangementId2 = revRec.getValue('revenuearrangement')
                  log.debug('Revenue Element ID', revenueArrangementId2);

                var revenueArrangementRecord = record.load({
                    type: 'revenuearrangement',
                    id: revenueArrangementId2,
                    isDynamic: false
                });

                // Locate the line associated with this Revenue Element
                var lineCount = revenueArrangementRecord.getLineCount({ sublistId: 'revenueelement' });
                for (var i = 0; i < lineCount; i++) {
                  var currentElementId = revenueArrangementRecord.getSublistValue({
                        sublistId: 'revenueelement',
                        fieldId: 'revenueelement',
                        line: i
                    });
                  log.audit('currentElementId',currentElementId)
                  if(currentElementId == revenueElementId)
                  {
                        /*revenueArrangementRecord.setSublistValue({
                            sublistId: 'revenueelement',
                            fieldId: 'revenuerecognitionrule',
                            line: i,
                            value: '2'
                        });*/
                            revenueArrangementRecord.setSublistValue({
                            sublistId: 'revenueelement',
                            fieldId: 'revrecstartdate',
                            line: i,
                            value: sourceStartDate
                        });
                      
                        revenueArrangementRecord.setSublistValue({
                            sublistId: 'revenueelement',
                            fieldId: 'revrecenddate',
                            line: i,
                            value: sourceEndDate
                        });
                     revenueArrangementRecord.setSublistValue({
                            sublistId: 'revenueelement',
                            fieldId: 'forecaststartdate',
                            line: i,
                            value: sourceStartDate
                        });
                      
                        revenueArrangementRecord.setSublistValue({
                            sublistId: 'revenueelement',
                            fieldId: 'forecastenddate',
                            line: i,
                            value: sourceEndDate
                        });
                  }
                       
                    }
                

                var arrangementId = revenueArrangementRecord.save();
                log.audit('Revenue Arrangement Updated', arrangementId);
            } catch (error) {
                log.debug('Error Updating Revenue Arrangement', error);
            }
        }
    }

    function reduce(context) {
        // Not used in this script
    }

    function summarize(summary) {
        log.audit('Map/Reduce Script Summary', {
            totalProcessed: summary.mapSummary.keys.length,
            errors: summary.inputSummary.error
        });

        summary.mapSummary.errors.iterator().each(function(key, error) {
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});