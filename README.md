# front_sm2

SM2相关签名算法



### 获取随机SM2密钥对

```javascript
var ec = new rs.KJUR.crypto.ECDSA({ curve: 'sm2' });
var keypair = ec.generateKeyPairHex();

var privateKey = keypair.ecprvhex;
var publickey = keypair.ecpubhex;

prvKeyHEX: 54232d8aaa3209ee123e07c34314e50e29fbb941496f92e219eb62c5bd40d968

publicKeyHEX: 044a77c33fa976ddab1d8e2ad05694f01151ed39892832947fbcb4a89199db72bc5db91b29616009f0b504459ad72f97b078cf35aebd32b6066003dd81db9a3244
```



### 根据BIP39生成固定SM2密钥对

```javascript
return bip39.mnemonicToSeed(val, password).then(bytes => {
    var ec = new rs.KJUR.crypto.ECDSA({ curve: 'sm2' })
    var d = BigInteger.fromBuffer(SHA.sha256(bytes.toString('hex')))
    var currentPrv = leftPad(d.toString(16), 64) // 补位
    var P = ec.ecparams.G.multiply(d) // P = dG，p 为公钥，d 为私钥
    var Px = leftPad(P.getX().toBigInteger().toString(16), 64)
    var Py = leftPad(P.getY().toBigInteger().toString(16), 64)
    var currentPub = `04${Px}${Py}`
    return { currentPrv, currentPub }
})
```



### SM2签名

```javascript
var sigSign = new rs.KJUR.crypto.Signature({ alg: 'SM3withSM2', prov: 'cryptojs/jsrsa' })
sigSign.initSign({ ecprvhex: prvKeyHEX, eccurvename: 'sm2' })
sigSign.updateString(stringify(data))
return sigSign.sign()
```



### sm2验签

```javascript
var sigVerify = new rs.KJUR.crypto.Signature({ alg: 'SM3withSM2', prov: 'cryptojs/jsrsa' })
sigVerify.initVerifyByPublicKey({ ecpubhex: publicKeyHEX, eccurvename: 'sm2' })
sigVerify.updateString(stringify(data))
return sigVerify.verify(sign)
```




