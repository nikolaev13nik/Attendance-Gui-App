export function encoderBase64(user) {
let str= user.idUser+":"+user.password;
let base64=btoa(str);
return "Basic "+base64;
}