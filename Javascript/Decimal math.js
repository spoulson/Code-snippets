/*
 parseCurrency('10.95') => 1095
 currencyToString(1095) => '10.95'

Fixed point math reference:
Addition:         fpa + fpb = sum
Subtraction:      fpa - fpb = difference
Multiplication:   fp = fixed point, n = numeric value
   fpa * fpb =>   parseInt(fpa * fpb / 100) = product
   fp * n    =>   fp * n = product
Division:
   fpa / fpa =>   parseInt(fpa * 100 / fpb) = quotient
   fp / n    =>   fp / n = quotient
*/

// Parse a float or numeric string into fixed point currency,
// rounding to 2 decimals.
function parseCurrency(v) {
   return Math.round(parseFloat(v) * 100);
}

// Format a currency to string.
function currencyToString(c) {
   var cs = '' + c;
   if (cs.substr(0, 1) === '-' && cs.length < 4) cs = '-' + tail(3, '00' + cs.substr(1));
   else if (cs.length < 3) cs = tail(3, '00' + cs);
 
   var whole = cs.substr(0, cs.length - 2);
   if (isNaN(whole)) whole = '0';
   var fractional = tail(2, cs);
   if (isNaN(fractional)) fractional = '00';
   return whole + '.' + fractional;
  
   function tail(len, s) {
      return s.substr(s.length - len, len);
   }
}
﻿