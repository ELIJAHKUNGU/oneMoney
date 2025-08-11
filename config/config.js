module.exports = {
  oneMoneyPublicKey: `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzT00cO3c0GKpFSRA2JTfYKiPfwthrG3Q1PRaOEm1rdBkGWEL3120Ukh/OBRPpzSJHgffyivWtdxUIREEFehdARG3Ru/nhehmPbzODLInVUXib6VTmyc+o9NssQwzuqyXtHCpFOAcZUyIliI12MREz3pWRFdU9vutPE7egBdiInzRdm5hC1z809Q/OA4HkosQqpvHF24Tmjfvj97gUY/zwrX0dY5PRsIlJjuV1K5zhXu3TDYbbC8Nyclmbsk1AYGS9kQKtJsYWaN4zIM8svz5IGT8Mg/FTARGKyhSXDR0lJ3ZvLYdvrVNu1XD5/OR6m+9Z1BbWeYPwXK5tGe9LEH2nQIDAQAB`,
  merchantId: '1883151315996622850',
  encryptKeyId: '6c12e964cd59',
  apiEndpoints: {
    c2bPush: 'http://172.28.255.24:8087/api/pay/payment/push',
    c2bQuery: 'http://172.28.255.24:8087/api/pay/payment/order/status/query',
    b2cPayment: 'http://172.28.255.24:8087/api/thirdParty/paying',
    b2cQuery: 'http://172.28.255.24:8087/api/thirdParty/paying/order/check',
    refund: 'http://172.28.255.24:8087/api/trade/refund/order/create',
    refundCheck: 'http://172.28.255.24:8087/api/trade/refund/order/check'
  },
  notifyUrl: 'http://yourdomain.com/onemoney/notify'
};

// exports.merchantNo = '1883151315996622850'
// exports.encryptKeyID = '6c12e964cd59'