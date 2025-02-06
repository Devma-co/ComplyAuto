/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/log'], (search, record, log) => {
    const execute = (context) => {
        try {
            // Create the customer search to find addresses with the label "To Delete"
            const customerSearchObj = search.create({
                type: "customer",
                filters: [
                    ["addresslabel", "is", "To Delete"],
                    //"AND",
                  // ["internalid", "anyof", "4283"]
                ],
                columns: [
                    search.createColumn({ name: "internalid", label: "Customer: Internal ID" }),
                    search.createColumn({ name: "addressinternalid", label: "Address Internal ID" }),
                    search.createColumn({ name: "addresslabel", label: "Address Label" })
                ]
            });

            // Run the search and count the results
            const searchResultCount = customerSearchObj.runPaged().count;
            log.debug("customerSearchObj result count", searchResultCount);

            // Iterate through the search results
            customerSearchObj.run().each(result => {
                const customerId = result.getValue({ name: "internalid" });
                const addressInternalId = result.getValue({ name: "addressinternalid" });

                log.debug("Processing Customer", `Customer ID: ${customerId}, Address ID: ${addressInternalId}`);

                if (customerId && addressInternalId) {
                    try {
                       
                        // Load the customer record
                       const customerRecord = record.load({
                            type: record.Type.CUSTOMER,
                            id: customerId,
                            //isDynamic: true
                        });

                        // Find and remove the address by internal ID
                        const addressCount = customerRecord.getLineCount({ sublistId: 'addressbook' });
                       for (let i = 0; i < addressCount; i++) {
                            const currentAddressId = customerRecord.getSublistValue({
                                sublistId: 'addressbook',
                                fieldId: 'addressid',
                                line: i
                            });

                            if (currentAddressId === addressInternalId) {
                                customerRecord.removeLine({
                                    sublistId: 'addressbook',
                                    line: i
                                });
                                log.debug('Address Removed', `Customer ID: ${customerId}, Address ID: ${addressInternalId}`);
                                break;
                            }
                        }

                        // Save the updated customer record
                        customerRecord.save();
                    } catch (error) {
                        log.error("Error Removing Address", `Customer ID: ${customerId}, Address ID: ${addressInternalId}, Error: ${error.message}`);
                    }
                }

                return true; // Continue processing next result
            });
        } catch (error) {
            log.error("Script Execution Error", error.message);
        }
    };

    return { execute };
});