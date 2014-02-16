/**
 * @abstract This file represents a sub-module for the encryption module.
 *  It's an AES Rijndael algorithm. Cypher-block-cypher algorithm.
 *  1st part - constants and variables
 *  2nd part - base algorithms (ExpandKey, ShiftRows, SubBytes, RotWord, SubWords)
 *  3rd part - encryption and decryption algorithms
 *  4th part - interface
 * As part of Private Social Networks Project (PriSN Project)
 * @author FlyingHam (also known as BrownCap) (c), 2014
 **/

/************  NEEDED CONSTANTS & VARIABLES   *************/
var _state; //current status block
var _key; //current key

const Sbox = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
];

const InvSbox = [
    0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb
    , 0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb
    , 0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e
    , 0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25
    , 0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92
    , 0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84
    , 0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06
    , 0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b
    , 0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73
    , 0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e
    , 0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b
    , 0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4
    , 0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f
    , 0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef
    , 0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61
    , 0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d
];

const Rcon = [
    0x8d, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d, 0x9a,
    0x2f, 0x5e, 0xbc, 0x63, 0xc6, 0x97, 0x35, 0x6a, 0xd4, 0xb3, 0x7d, 0xfa, 0xef, 0xc5, 0x91, 0x39,
    0x72, 0xe4, 0xd3, 0xbd, 0x61, 0xc2, 0x9f, 0x25, 0x4a, 0x94, 0x33, 0x66, 0xcc, 0x83, 0x1d, 0x3a,
    0x74, 0xe8, 0xcb, 0x8d, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8,
    0xab, 0x4d, 0x9a, 0x2f, 0x5e, 0xbc, 0x63, 0xc6, 0x97, 0x35, 0x6a, 0xd4, 0xb3, 0x7d, 0xfa, 0xef,
    0xc5, 0x91, 0x39, 0x72, 0xe4, 0xd3, 0xbd, 0x61, 0xc2, 0x9f, 0x25, 0x4a, 0x94, 0x33, 0x66, 0xcc,
    0x83, 0x1d, 0x3a, 0x74, 0xe8, 0xcb, 0x8d, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b,
    0x36, 0x6c, 0xd8, 0xab, 0x4d, 0x9a, 0x2f, 0x5e, 0xbc, 0x63, 0xc6, 0x97, 0x35, 0x6a, 0xd4, 0xb3,
    0x7d, 0xfa, 0xef, 0xc5, 0x91, 0x39, 0x72, 0xe4, 0xd3, 0xbd, 0x61, 0xc2, 0x9f, 0x25, 0x4a, 0x94,
    0x33, 0x66, 0xcc, 0x83, 0x1d, 0x3a, 0x74, 0xe8, 0xcb, 0x8d, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20,
    0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d, 0x9a, 0x2f, 0x5e, 0xbc, 0x63, 0xc6, 0x97, 0x35,
    0x6a, 0xd4, 0xb3, 0x7d, 0xfa, 0xef, 0xc5, 0x91, 0x39, 0x72, 0xe4, 0xd3, 0xbd, 0x61, 0xc2, 0x9f,
    0x25, 0x4a, 0x94, 0x33, 0x66, 0xcc, 0x83, 0x1d, 0x3a, 0x74, 0xe8, 0xcb, 0x8d, 0x01, 0x02, 0x04,
    0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d, 0x9a, 0x2f, 0x5e, 0xbc, 0x63,
    0xc6, 0x97, 0x35, 0x6a, 0xd4, 0xb3, 0x7d, 0xfa, 0xef, 0xc5, 0x91, 0x39, 0x72, 0xe4, 0xd3, 0xbd,
    0x61, 0xc2, 0x9f, 0x25, 0x4a, 0x94, 0x33, 0x66, 0xcc, 0x83, 0x1d, 0x3a, 0x74, 0xe8, 0xcb
];

var complexity = 1; // 1 - 128-bit length key, 2 - 192-bit length key, 3 - 256-bit length key
const Nb = 4;

/************  BASE ALGORITHMS   *************/
/*
    Error codes:
        0x00 - Unknown error
        0x01 - Encryption error: <type here>
        0x02 - Decryption error: <type here>
 */
function error(code,msg){
    self.port.emit("cryptError",{code:code,msg:msg});
}
//need to move it to encrypter.js file
const BYTES_PER_CHAR = 2;
function StringToASCIIArray(str){
    var arr = [];
    var c,j,len = BYTES_PER_CHAR*str.length;
    for(var i = 0; i<len; i+=BYTES_PER_CHAR){
        c = str.charCodeAt( (i/BYTES_PER_CHAR)<<0 );
        for(j=0;j<BYTES_PER_CHAR; j++)
            arr[i+j] = (c>>j*8)&0xFF;
    }
    return arr;
}
function ASCIIArrayToString(arr){
    var str = "";
    var c, j;
    if(BYTES_PER_CHAR!=1&&arr.length%BYTES_PER_CHAR!=0) return "";
    for(var i = 0; i<arr.length; i+=BYTES_PER_CHAR){
        c=0;
        for(j=0; j<BYTES_PER_CHAR; j++){
            c|=(arr[i+j]<<j*8);
        }
        str+=String.fromCharCode( c );
    }
    return str;
}

function RotWord(arr,shift){
    //console.log("Rot() started with arr="+arr.join(''));
    var t = arr.slice(0,shift);
    arr=arr.slice(shift);
    arr=Array.concat(arr,t);
    //console.log("Rot() ended with result="+arr.join('')+" and t="+ t.join(''));
    return arr;
}

function SubWord(arr){
    //console.log("SubWord() started with arr="+arr.join(''));
    for(var i=0; i<4; i++){
        arr[i]=Sbox[arr[i]];

    }

    //console.log("SubWord() result="+arr.join(''));
    return arr;
}

function InvSubWord(arr){
    //console.log("SubWord() started with arr="+arr.join(''));
    for(var i=0; i<4; i++){
        arr[i]=InvSbox[arr[i]];
    }

    //console.log("SubWord() result="+arr.join(''));
    return arr;
}

//Expand keys for each round. Makes Nb*(Nr+1) keys (Well chars, actually, the number of keys is (Nr+1))
function KeyExpansion(key){
    var i,j = 0,
        size = Nb*(8+2*complexity+1),
        Nk = (key.length/4)<<0;
    var temp=[];
    _key = key.splice(0,Nk*4);
    i=Nk;
    // console.log(round_keys.join('')+"   "+i);
    while(i<size){
        //  console.log("cycle started: i="+i+" size="+size);
        for(j=0;j<4;j++)
        {
            //     console.log("(cycle)temp["+j+"]="+round_keys[(i-1) * 4 + j]);
            temp[j]=_key[(i-1) * 4 + j];
        }
        //  console.log("(result)temp="+temp.join(''));
        if (i % Nk == 0)
        {
            temp = RotWord(temp,1);
            temp = SubWord(temp);
            temp[0] =  temp[0] ^ Rcon[i/Nk];
        }
        else if (Nk > 6 && i % Nk == 4)
        {
            temp = SubWord(temp);
        }
        for(j=0;j<4;j++)
        {
            _key[i*4+j] = _key[(i-Nk)*4+j] ^ temp[j];
        }
        i++;
        // console.log("cycle ended: temp="+temp.join('')+" round_keys="+round_keys.join(''));
    }

    //console.log("Round keys: "+_key);
}

/**
 *  This function adds the round key to state.
 *  The round key is added to the state by an XOR function.
 *  @return XORed status matrix with current round key
 *  @arguments round - current round number, state - state block
 **/
function AddRoundKey(round){
    var i,j;
    //console.log("AddRoundKey() function started");
    for (i = 0; i<4; i++)
    {
        for (j = 0; j<4; j++)
        {
            _state[j][i] ^= _key[round * Nb * 4 + i * Nb + j];
        }
    }
    //console.log("AddRoundKey() function ended");
    return _state;
}

/**
 * The SubBytes Function Substitutes the values in the
 * state matrix with values in an S-box.
 * @return Substituted state matrix
 * @arguments state - state matrix
 **/

function SubBytes(){
    var i,j;
    for(i=0;i<4;i++)
    {
        for (j = 0; j<4; j++)
        {
            _state[i][j] = Sbox[_state[i][j]];

        }
    }
}
/**
 * The ShiftRows() function shifts the rows in the state to the left.
 * Each row is shifted with different offset.
 * Offset = Row number. So the first row is not shifted.
 * @return Shifted state matrix
 * @arguments state - state matrix
 **/
function ShiftRows(){
    var i;
    //Starting from 1, because at i=0 there is nothing you can do
    /*for(i=1; i<4; i++){
     _state[i]=RotWord(_state[i]);
     }*/
    var temp;

    // Rotate first row 1 columns to left
    temp = _state[1][0];
    _state[1][0] = _state[1][1];
    _state[1][1] = _state[1][2];
    _state[1][2] = _state[1][3];
    _state[1][3] = temp;

    // Rotate second row 2 columns to left
    temp = _state[2][0];
    _state[2][0] = _state[2][2];
    _state[2][2] = temp;
    temp = _state[2][1];
    _state[2][1] = _state[2][3];
    _state[2][3] = temp;

    // Rotate third row 3 columns to left
    temp = _state[3][0];
    _state[3][0] = _state[3][3];
    _state[3][3] = _state[3][2];
    _state[3][2] = _state[3][1];
    _state[3][1] = temp;

}
// xtime is a macro that finds the product of {02} and the argument to xtime modulo {1b}
function xtime(x){
    return ((x<<1) ^ (((x>>7) & 1) * 0x1b))&0xFF;
}

// MixColumns function mixes the columns of the state matrix
function MixColumns(){
    var i;
    var Tmp, Tm, t;
    for (i = 0; i < 4; i++)
    {
        t = _state[0][i];
        Tmp = _state[0][i] ^ _state[1][i] ^ _state[2][i] ^ _state[3][i];
        Tm = _state[0][i] ^ _state[1][i]; Tm = xtime(Tm); _state[0][i] ^= Tm ^ Tmp;
        Tm = _state[1][i] ^ _state[2][i]; Tm = xtime(Tm); _state[1][i] ^= Tm ^ Tmp;
        Tm = _state[2][i] ^ _state[3][i]; Tm = xtime(Tm); _state[2][i] ^= Tm ^ Tmp;
        Tm = _state[3][i] ^ t; Tm = xtime(Tm); _state[3][i] ^= Tm ^ Tmp;
    }
}


// The SubBytes Function Substitutes the values in the
// state matrix with values in an S-box.
function InvSubBytes(){
    var i,j;
    for (i = 0; i<4; i++)
    {
        for (j = 0; j<4; j++)
        {
            _state[i][j] = InvSbox[_state[i][j]];

        }
    }
}

// The ShiftRows() function shifts the rows in the state to the left.
// Each row is shifted with different offset.
// Offset = Row number. So the first row is not shifted.
function InvShiftRows(){
    var temp;

    // Rotate first row 1 columns to right
    temp = _state[1][3];
    _state[1][3] = _state[1][2];
    _state[1][2] = _state[1][1];
    _state[1][1] = _state[1][0];
    _state[1][0] = temp;

    // Rotate second row 2 columns to right
    temp = _state[2][0];
    _state[2][0] = _state[2][2];
    _state[2][2] = temp;

    temp = _state[2][1];
    _state[2][1] = _state[2][3];
    _state[2][3] = temp;

    // Rotate third row 3 columns to right
    temp = _state[3][0];
    _state[3][0] = _state[3][1];
    _state[3][1] = _state[3][2];
    _state[3][2] = _state[3][3];
    _state[3][3] = temp;
}

function Multiply(x,y) {
    return (
        ((y & 1) * x) ^ ((y>>1 & 1) *
            xtime(x)) ^ ((y>>2 & 1) *
            xtime(xtime(x))) ^ ((y>>3 & 1) *
            xtime(xtime(xtime(x)))) ^ ((y>>4 & 1) *
            xtime(xtime(xtime(xtime(x)))))
        )&0xFF;
}

// MixColumns function mixes the columns of the state matrix.
// The method used to multiply may be difficult to understand for the inexperienced.
// Please use the references to gain more information.
function InvMixColumns(){
    var i;
    var a,b,c,d;
    for(i=0;i<4;i++)
    {

        a = _state[0][i];
        b = _state[1][i];
        c = _state[2][i];
        d = _state[3][i];


        _state[0][i] = Multiply(a, 0x0e) ^ Multiply(b, 0x0b) ^ Multiply(c, 0x0d) ^ Multiply(d, 0x09);
        _state[1][i] = Multiply(a, 0x09) ^ Multiply(b, 0x0e) ^ Multiply(c, 0x0b) ^ Multiply(d, 0x0d);
        _state[2][i] = Multiply(a, 0x0d) ^ Multiply(b, 0x09) ^ Multiply(c, 0x0e) ^ Multiply(d, 0x0b);
        _state[3][i] = Multiply(a, 0x0b) ^ Multiply(b, 0x0d) ^ Multiply(c, 0x09) ^ Multiply(d, 0x0e);
    }
}


function EncryptReadyBlock(Nr){
    var round;

    /** Add the First round key to the state before starting the rounds. **/
    AddRoundKey(0);
    /** There will be Nr rounds.
     * The first Nr-1 rounds are identical.
     * These Nr-1 rounds are executed in the loop below.
     **/
    for(round=1;round<Nr;round++)
    {
        SubBytes();
        ShiftRows();
        MixColumns();
        AddRoundKey(round);
    }
    /**
     * The last round is given below.
     * The MixColumns function is not here in the last round.
     * Because MixColumns in the last round does not increase security level of the cyphertext.
     **/
    SubBytes();
    ShiftRows();
    AddRoundKey(Nr);

}

// InvCipher is the main function that decrypts the CipherText.
function DecryptReadyBlock(Nr){
    var round;

    /**
     * Add the First round key to the _state before starting the rounds.
     **/
    AddRoundKey(Nr);
    /**
     * There will be Nr rounds.
     * The first Nr-1 rounds are identical.
     * These Nr-1 rounds are executed in the loop below.
     **/

    for(round=Nr-1;round>0;round--)
    {
        InvShiftRows();
        InvSubBytes();
        AddRoundKey(round);
        InvMixColumns();
    }

    /**
     * The last round is given below.
     * The MixColumns function is not here in the last round.
     **/

    InvShiftRows();
    InvSubBytes();
    AddRoundKey(0);

}


//AES class
var AES = {
    saltBefore:true,
    saltAfter:true,
    saltBlocks:1,
    keyLength:128,
    //current string data
    saltB:"",
    saltA:"",
    padding:"",
    iv:"",
    Nr:0,
    base:35,
    charlen:2,
    genStr:function(l){
        var i;
        var str = "";
        var len = typeof l !== "undefined" ? l : 4*Nb*this.saltBlocks;
        for(i=0;i<len; i++)
            str+=String.fromCharCode((Math.random()*255)<<0);
        return str;
    },
    fixedPuts:function(num,len,base){
        if(typeof base === "undefined") base = this.base;
       return ("00000000000000000000"+num.toString(base)).slice(-len); //20 chars max
    },
    encode:function(arr,base){
        if(typeof base === "undefined") base = this.base;
        var i;
        var res = "";
        for(i=0; i<arr.length; i++)
            res+=this.fixedPuts(arr[i],this.charlen,base);

        return res;
    },
    decode:function(str,base){
        if(typeof base === "undefined") base = this.base;
        var i,len = (str/this.charlen)<<0;
        var arr = [];
        for(i=0; i<len; i+=this.charlen)
            arr[(i/this.charlen)<<0] = parseInt(str.substr(i,this.charlen),base);
        return arr;
    },

    toIntArray:function(str){
        var arr = [];
        for(var i=0; i<str.length; i++){
            arr[i] = str.charCodeAt(i);
        }
        return arr;
    },
    xorStr:function(str1,str2){
        var res = "";
        var i,l=Math.min(str1.length,str2.length);
        for(i=0; i<l; i++){
            res+=String.fromCharCode(str1.charCodeAt(i)^str2.charCodeAt(i));
        }
        return res;
    },
    EncryptBlock:function(str){
        var i,j;
        _state = [[],[],[],[]];
        var res;
        /** Copy the input PlainText to state array. **/
        for(i=0;i<4;i++)
        {
            for(j=0;j<4;j++)
            {
                _state[j][i] = str.charCodeAt(i*4 + j);
            }
        }
        /** Encrypt block **/
        EncryptReadyBlock(this.Nr);
        /**
         * The encryption process is over.
         * Copy the _state array to output array.
        **/
        res = "";
        for(i=0;i<4;i++)
        {
            for(j=0;j<4;j++)
            {
                res+=String.fromCharCode(_state[j][i]);
            }
        }
        //console.log("Final (encrypt) output: "+res);
        return res;
    },
    DecryptBlock:function(str){
        var i,j;
        _state = [[],[],[],[]];
        var res;
        //Copy the input CipherText to _state array.
        for(i=0;i<4;i++)
        {
            for(j=0;j<4;j++)
            {
                _state[j][i] = str.charCodeAt(i*4 + j);
            }
        }

        DecryptReadyBlock(this.Nr);
        /**
         * The decryption process is over.
         * Copy the state array to output array.
        **/
        res = "";
        for(i=0;i<4;i++)
        {
            for(j=0;j<4;j++)
            {
                res+=String.fromCharCode(_state[j][i]);
            }
        }
        //console.log("Final (decrypt) output: "+res);
        return res;
    },
    /**
     * see Wikipedia: http://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Cipher-block_chaining_.28CBC.29
    **/

    CBCEncrypt:function(str,iv){
        var prevstr,curstr,res = "";
        var i,bl=(str.length/(Nb*4))<<0;
        /** first step **/
        prevstr = iv;
        for(i=0;i<bl;i++){
            curstr = str.substr(i*Nb*4,Nb*4);
            curstr = this.xorStr(curstr,prevstr);
            prevstr=this.EncryptBlock(curstr);
            res+=prevstr;
        }

       return res;
    },
    CBCDecrypt:function(str,iv){
        var prevstr,curstr,res="";
        var i,bl=(str.length/(Nb*4))<<0;
        prevstr = iv;
        for(i=0;i<bl;i++){
            curstr = str.substr(i*Nb*4,Nb*4);
            res+=this.xorStr(prevstr,this.DecryptBlock(curstr));
            prevstr = curstr;
        }

        return res;
    },
    encrypt:function(str,key){
        var serialized;

        if(this.keyLength%32 != 0) this.keyLength = this.keyLength + (32 - this.keyLength%32);
        if(this.keyLength<128) this.keyLength = 128;
        else if(this.keyLength>256) this.keyLength = 256;

        if(this.saltBlocks > 255) this.saltBlocks = this.saltBlocks %256;

        this.saltB=(this.saltBefore)?this.genStr():"";
        this.saltA=(this.saltAfter)?this.genStr():"";
        this.padding=this.genStr(4*Nb-str.length%(4*Nb));

        key = this.toIntArray(key);
        this.iv=this.genStr(4*Nb);
        //console.log("Encryption algorithm. iv:"+this.iv);
        serialized = "AES::" + AES.fixedPuts(AES.saltBlocks,2,16) + (1*AES.saltBefore).toString() +
                    (1*AES.saltAfter).toString() + AES.fixedPuts(this.padding.length,2,16) + "::AES"; //Max chars: 1,048,560.
        KeyExpansion(key);
        this.Nr = 6+this.keyLength/32;
        serialized  = this.EncryptBlock(serialized);
        serialized += this.EncryptBlock(this.iv);
        serialized += this.CBCEncrypt(this.saltB+this.padding+str+this.saltA,this.iv);

       return serialized;
    },
    decrypt:function(str,key){
        var header,decrypted;
        var nSalt,saltB,saltA,nPadding;
        if(this.keyLength%32 != 0) this.keyLength = this.keyLength + (32 - this.keyLength%32);
        if(this.keyLength<128) this.keyLength = 128;
        else if(this.keyLength>256) this.keyLength = 256;


        key = this.toIntArray(key);
        KeyExpansion(key);

        //header
        header = this.DecryptBlock(str.substr(0,Nb*4));
        if(header.indexOf("AES::")!=0&&header.lastIndexOf("::AES")!=Nb*4-5){
            console.log("FAIL!");

            error(0x02,"Header is corrupted");
            return "";
        }

        /**
         * @header:
         *  1) 0-4   - AES signature.
         *  2) 5-6   - Number of salt blocks. (hex)
         *  3) 7     - Are there salt blocks before the message. (0-1)
         *  4) 8     - Are there salt blocks after the message. (0-1)
         *  5) 9-10  - Number of padding (!)chars before the message. (hex)
         *  6) 11-15 - AES signature
         **/
        nSalt = parseInt(header.substr(5,2),16);
        saltB = parseInt(header.charAt(7),10);
        saltA = parseInt(header.charAt(8),10);
        nPadding = parseInt(header.substr(9,2),16);

        /** decrypt iv block **/
        this.iv = this.DecryptBlock(str.substr(Nb*4,Nb*4));
        /** copy the message and decrypt it **/
        decrypted = this.CBCDecrypt(str.substr(Nb*4*2),this.iv);
        return decrypted.substring(Nb*4*(nSalt*saltB)+nPadding,decrypted.length-Nb*4*saltA*nSalt);

    }

};

console.log("FF:"+AES.decrypt(AES.encrypt("AZAZAZA","1234567812345678"),"1234567812345678"));
//interface with encrypt module

function encryptStart(plaintext,key){
    //break into lines
    var cyphertext = [];
    var blocks  = [];
    var size = 0,rounds = 8+2*complexity;
    var i= 0;
    KeyExpansion(StringToASCIIArray(key));
    plaintext=StringToASCIIArray(plaintext);
    //break into matrix
    console.log("Starting decryption engine: plaintext before "+plaintext);
    for(; i*16<plaintext.length; i++){
        blocks[i] = plaintext.slice(i*16,(i+1)*16);
        console.log("blocks["+i+"]="+blocks[i]);
        size++;
    }
    console.log("Starting encryption engine: blocks "+size);
    console.log("PLAINTEXT: "+plaintext);
    //for each block
    for(i=0; i<size; i++){
        console.log("Encrypting block "+(i+1)+"/"+size+"..."+"("+blocks[i]+")");
        cyphertext = Array.concat(cyphertext,Encrypt(blocks[i], rounds));
        //console.log("Encrypted!");
    }
    console.log("Final encryption result (hex): "+cyphertext);
    cyphertext = ASCIIArrayToString(cyphertext);
    console.log("Final encryption result (string): "+cyphertext);
    return cyphertext;
}

function decryptStart(cyphertext,key){
    //break into lines
    var plaintext = [];
    var blocks  = [];
    var size = 0,rounds = 8+2*complexity;
    var i= 0;
    KeyExpansion(StringToASCIIArray(key));
    //break into matrix
    cyphertext=StringToASCIIArray(cyphertext);
    console.log("Starting decryption engine: cyphertext before "+cyphertext);
    for(; i*16<cyphertext.length; i++){
        blocks[i] = cyphertext.slice(i*16,(i+1)*16);
        console.log("blocks["+i+"]="+blocks[i]);
        size++;
    }
    console.log("Starting decryption engine: blocks "+size);
    console.log("CYPHERTEXT: "+cyphertext);
    //for each block
    for(i=0; i<size; i++){
        console.log("Decrypting block "+(i+1)+"/"+size+"..."+"("+blocks[i]+")");
        plaintext = Array.concat(plaintext,Decrypt(blocks[i], rounds));
        //console.log("Decrypted!");
    }
    console.log("Final decryption result (hex): "+plaintext);
    plaintext = ASCIIArrayToString(plaintext);
    console.log("Final decryption result (string): "+plaintext);
    return plaintext;
}
//console.log("Final Result: "+decryptStart(encryptStart("abcdabcdabcdabcd1234567812345678","1234567812345678"),"1234567812345678"));


/*function main(){
    self.port.on("encrypt",encryptStart);
    self.port.on("decrypt",decryptStart);
    //destroy function
}

main();*/