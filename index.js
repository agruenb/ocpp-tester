import { RPCClient } from 'ocpp-rpc';

let currentTransactionId = 0;

const cli = new RPCClient({
    endpoint: 'ws://localhost:3001', // the OCPP endpoint URL
    identity: 'ocppClient-Y',             // the OCPP identity
    protocols: ['ocpp1.6'],          // client understands ocpp1.6 subprotocol
    strictMode: true,                // enable strict validation of requests & responses
});

function statusNotifications(){
    setInterval(() => {
        console.log("StartCharge");
        cli.call('StatusNotification', {
            connectorId: 0,
            errorCode: "NoError",
            status: "Charging",
        });
    }, 6000);
    setTimeout(
        () => setInterval(() => {
            console.log("StopCharge");
            cli.call('StatusNotification', {
                connectorId: 0,
                errorCode: "NoError",
                status: "Available",
            });
        }, 6000)
        ,3000
    );
}

function startStopTransaction(){
    setTimeout(async ()=>{
        console.log("Start Transaction");
        let response = await cli.call('StartTransaction', {
            connectorId: 0,
            idTag: "fakeId",
            meterStart: 92328,
            timestamp:(new Date()).toISOString()
        });
        currentTransactionId = response.transactionId;
    }, 1000);

    setTimeout(()=>{
        console.log("Stopped Transaction");
        cli.call('StopTransaction', {
            transactionId: currentTransactionId,
            meterStop: 92328,
            timestamp:(new Date()).toISOString()
        });
    }, 4000);
}

// connect to the OCPP server
await cli.connect();

console.log("Connected");

// send a BootNotification request and await the response
const bootResponse = await cli.call('BootNotification', {
    chargePointVendor: "ocpp-rpc",
    chargePointModel: "ocpp-rpc",
});

console.log("Booted");

// check that the server accepted the client
if (bootResponse.status === 'Accepted') {

    // send a Heartbeat request and await the response
    const heartbeatResponse = await cli.call('Heartbeat', {});
    // read the current server time from the response
    console.log('Server time is:', heartbeatResponse.currentTime);

    // send a StatusNotification request for the controller
    await cli.call('StatusNotification', {
        connectorId: 0,
        errorCode: "NoError",
        status: "Available",
    });
    //test area
    startStopTransaction();
    
}

cli.handle("RemoteStartTransaction", (params) => {
    console.log("RemoteStartTransaction");
    console.log(params);
    let response = {
        status: "Accepted"
    };
    return response;
});
/* cli.on("response", (obj)=>{
    console.log("Final Message: ", obj);
}); */

cli.handle('Heartbeat', () => {
    return { currentTime: new Date().toISOString() };
});