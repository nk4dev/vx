import { getRpcUrl } from '../core/contract';

interface SendETHRequest {
    to: string;
    from: string;
    amountEth: string;
    rpcUrl?: string;
    privateKey?: string;
}


export function sendETHRequestQuery({
    to, from, amountEth, rpcUrl, privateKey
}: SendETHRequest) {
    return { to, from, amountEth, rpcUrl, privateKey };
}