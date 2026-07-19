const dns = require('dns');

// Disable SSL certificate verification globally (required both locally and on Vercel due to expired certificates)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

dns.setDefaultResultOrder('ipv4first');

// Detect environment
const isVercel = process.env.VERCEL === '1' || process.env.NOW_BUILD === '1';

// List of working IPs (Singapore POPs to bypass Geo-routing blocks and CloudFront WAF limits on Vercel)
const MOVIEBOX_IPS = ['65.8.76.78', '65.8.76.55', '65.8.76.90'];
const FMOVIES_IPS = ['13.35.163.59', '13.35.163.11', '13.35.163.124', '13.35.163.22'];

// Pick a random IP from a list
function getRandomIp(ipList) {
  return ipList[Math.floor(Math.random() * ipList.length)];
}

const originalLookup = dns.lookup;

dns.lookup = function(hostname, options, callback) {
  // Handle optional options argument
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  const all = options && options.all;

  if (hostname === 'moviebox.ph' || hostname === 'www.moviebox.ph') {
    const ip = getRandomIp(MOVIEBOX_IPS);
    if (all) {
      return callback(null, [{ address: ip, family: 4 }], ip);
    } else {
      return callback(null, ip, 4);
    }
  }

  if (hostname === 'fmoviesunblocked.net' || hostname === 'www.fmoviesunblocked.net') {
    const ip = getRandomIp(FMOVIES_IPS);
    if (all) {
      return callback(null, [{ address: ip, family: 4 }], ip);
    } else {
      return callback(null, ip, 4);
    }
  }

  if (hostname === 'netfilm.world' || hostname === 'www.netfilm.world') {
    const ip = getRandomIp(FMOVIES_IPS);
    if (all) {
      return callback(null, [{ address: ip, family: 4 }], ip);
    } else {
      return callback(null, ip, 4);
    }
  }

  if (hostname === 'h5-api.aoneroom.com') {
    const ip = '8.209.77.27';
    if (all) {
      return callback(null, [{ address: ip, family: 4 }], ip);
    } else {
      return callback(null, ip, 4);
    }
  }

  return originalLookup(hostname, options, callback);
};

// Override net.connect and tls.connect to force IPv4 (family: 4) to fix ENETUNREACH in Node fetch
const net = require('net');
const tls = require('tls');

const originalNetConnect = net.connect;
net.connect = function(...args) {
  if (args[0] && typeof args[0] === 'object') {
    args[0].family = 4;
  }
  return originalNetConnect.apply(this, args);
};

const originalTlsConnect = tls.connect;
tls.connect = function(...args) {
  if (args[0] && typeof args[0] === 'object') {
    args[0].family = 4;
  }
  return originalTlsConnect.apply(this, args);
};

console.log(`[DNS Override] Active for moviebox.ph & fmoviesunblocked.net (${isVercel ? 'Vercel Europe' : 'Local Singapore'} POPs, IPv4 Forced)`);
