# cdk-iot-security

## Usage

    import { JustInTimeRegistration } from '@softchef/cdk-iot-security';

    const jitr = new JustInTimeRegistration(stack, id, {});

    const jitr = new JustInTimeRegistration(stack, id, {
        verifier: [
            {
                name: "verifier_name",
                arn: "verifier_arn
            }
        ],
        api: RestAPI,
    })

    // No verifier specified
    var caRegisterApi = new CaRegisterApi(stack, 'id', {});

    // verifiers specified
    var caRegisterApi = new CaRegisterApi(stack, 'id', {
        verifiers: [{
            name: 'test_verifier_1',
            arn: 'test_verifier_1_arn',
        }, {
            name: 'test_verifier_2',
            arn: 'test_verifier_2_arn',
        },
        ...],
    });

    var caRegisterApi = new CaRegisterApi(stack, 'id', {
        verifiers: [{
            name: 'test_verifier_1',
            arn: 'test_verifier_1_arn',
        }],
        api: YOUR_OWN_REST_API
    });