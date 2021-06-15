const { ClientActivator } = require('./activator');

exports.handler = async (event) => {
    console.log({event: event});
    for (let record of event.Records) {
        const activator = new ClientActivator(record);
        await activator.activate();
    }
}