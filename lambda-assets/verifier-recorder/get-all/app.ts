export const handler = async (_event: any = {}) : Promise <any> => {
    return process.env.VERIFIERS;
}