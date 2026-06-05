const buf = require('buffer');
if (!buf.SlowBuffer) {
    buf.SlowBuffer = class SlowBuffer extends buf.Buffer {};
    buf.SlowBuffer.prototype.equal = buf.Buffer.prototype.equals;
}
