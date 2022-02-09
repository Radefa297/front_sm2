
(function (root, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory)
    } else if (typeof define === 'function' && define.cmd) {
        define(function (require, exports, module) {
            module.exports = factory()
        })
    } else {
        root.jsrsasign = factory();
    }
}(this, function () {
    return {
        SecureRandom: SecureRandom,
        rng_seed_time: rng_seed_time,
        BigInteger: BigInteger,
        RSAKey: RSAKey,
        ECDSA: KJUR.crypto.ECDSA,
        DSA: KJUR.crypto.DSA,
        Signature: KJUR.crypto.Signature,
        MessageDigest: KJUR.crypto.MessageDigest,
        Mac: KJUR.crypto.Mac,
        Cipher: KJUR.crypto.Cipher,
        ASN1HEX: ASN1HEX,
        X509: X509,
        CryptoJS: CryptoJS,

        // ext/base64.js
        b64tohex: b64tohex,
        b64toBA: b64toBA,

        // name spaces
        KJUR: KJUR,
        crypto: KJUR.crypto,
        asn1: KJUR.asn1,
        jws: KJUR.jws,
        lang: KJUR.lang,
    }
}))