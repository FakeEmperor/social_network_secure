var XOR={
    cyclicXOR:function (str,key){ //type==1 - encoding, type==2 - decoding
        var s=str.length,
        k=key.length;
        var res="",enc=0, enc_failed=0;
        var i=0;
        if(k!=0)
            for(; i<s; ++i){
                enc=str.charCodeAt(i)^key.charCodeAt(i%k);
                //if XOR result != source, or source char != key char (to ensure, that encrypted string will not be broken
                if(str.charCodeAt(i)!=key.charCodeAt(i%k)&&enc!=str.charCodeAt(i))//&&
                // ( enc>31&&(enc<127||enc>159) )) //html encode restriction
                    res+=String.fromCharCode(enc);
                else{
                    res+=str.charAt(i);
                    enc_failed++;
                }
            }

        return res;
    },
    encrypt:function(str,key){

    },
    decrypt:function(str,key){

    }
};