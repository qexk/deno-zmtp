/*
    This file is part of Deno-ZMTP, an implementation of ZMTP for Deno.
    Copyright (C) 2019 Contributors as noted in the AUTHORS.md file

    Deno-ZMTP is free software: you can redistribute it and/or modify it
    under the terms of the GNU Lesser General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    As a reminder, the Contributors give you permission to dynamically
    link this library from an executable, regardless of the license terms
    of the executable, and to copy and distribute the executable under
    terms of your choice.

    Deno-ZMTP is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
    FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public
    License for more details.

    You should have received a copy of the GNU Lesser
    General Public License along with Deno-ZMTP.  If not, see
    <https://www.gnu.org/licenses/>.
*/

import Zerializable from './Zerializable.ts';
import { MAX_SHORT_BODY_LEN } from './detail.ts';
import { encoder, decoder } from '../../deps.ts';

export default class Command implements Zerializable {
  private static readonly MAX_NAME_LEN = 0xFF;
  private static readonly SHORT_TAG = 0x04;
  private static readonly LONG_TAG = 0x06;

  constructor(
    public name: string = '',
    public readonly props = new Map<string, string>(),
  ) {}

  private serializeName(): Uint8Array {
    const truncated = this.name.substr(0, Command.MAX_NAME_LEN);
    const size = 1 + truncated.length;
    const buf = new ArrayBuffer(size);
    const encodeBuf = new Uint8Array(buf, 1);
    const ret = new Uint8Array(buf);
    const { written } = encoder.encodeInto(this.name, encodeBuf);
    ret[0] = written & Command.MAX_NAME_LEN;
    return ret;
  }

  private serializeProps(): Uint8Array {
    let size = 0;
    // Create a buffer big enough to contain all the data.
    for (let [k, v] of this.props)
    //   key prefix       utf max         value
    //        |      key     | value prefix | utf max
    //        v       v      v   v          v   v
      size += 1 + k.length * 3 + 4 + v.length * 3;
    const buf = new ArrayBuffer(size);
    const view = new DataView(buf);
    let ibuf = 0;
    for (let [rawk, rawv] of this.props) {
      const kbuf = new Uint8Array(buf, ibuf + 1);
      const { written: kout } = encoder.encodeInto(rawk, kbuf);
      view.setUint8(ibuf, kout);
      ibuf += kout + 1;
      const vbuf = new Uint8Array(buf, ibuf + 4);
      const { written: vout } = encoder.encodeInto(rawv, vbuf);
      view.setUint32(ibuf, vout, false);
      ibuf += vout + 4;
    }
    return new Uint8Array(buf.slice(0, ibuf));
  }

  serialize() {
    const name = this.serializeName();
    const props = this.serializeProps();
    const bodyLength = name.byteLength + props.byteLength;
    const buf = new Uint8Array(9 + bodyLength);
    let prefix: number;
    if (bodyLength <= MAX_SHORT_BODY_LEN) {
      prefix = 2;
      buf[0] = Command.SHORT_TAG;
      buf[1] = bodyLength;
    } else {
      prefix = 9;
      const view = new DataView(buf.buffer);
      view.setUint8(0, Command.LONG_TAG);
      view.setBigUint64(1, BigInt(bodyLength), false);
    }
    buf.set(name, prefix);
    buf.set(props, prefix + name.byteLength);
    return buf.subarray(0, prefix + bodyLength);
  }

  private async deserializeNameFrom(reader: Deno.Reader) {
    const buf = new Uint8Array(Command.MAX_NAME_LEN);
    await reader.read(buf.subarray(0, 1));
    const nameLength = buf[0];
    const nameBuf = buf.subarray(0, nameLength);
    await reader.read(nameBuf);
    this.name = decoder.decode(nameBuf);
    return BigInt(1 + nameLength);
  }

  private async deserializePropsFrom(reader: Deno.Reader, toRead: bigint) {
    const lenBuf = new Uint8Array(4);
    const lenView = new DataView(lenBuf.buffer);
    for (let bread = 0; bread < toRead; ) {
      await reader.read(lenBuf.subarray(0, 1));
      const nameBuf = new Uint8Array(lenView.getUint8(0));
      await reader.read(nameBuf);
      await reader.read(lenBuf);
      const valueBuf = new Uint8Array(lenView.getUint32(0, false));
      if (valueBuf.byteLength > 0)
        await reader.read(valueBuf);
      this.props.set(decoder.decode(nameBuf), decoder.decode(valueBuf));
      bread += 1 + nameBuf.byteLength + 4 + valueBuf.byteLength;
    }
  }

  async deserializeFrom(reader: Deno.Reader) {
    const tag = new ArrayBuffer(9);
    const tagView = new DataView(tag);
    let bodyLength: bigint;
    await reader.read(new Uint8Array(tag, 0, 1));
    if (tagView.getUint8(0) === Command.SHORT_TAG) {
      await reader.read(new Uint8Array(tag, 0, 1));
      bodyLength = BigInt(tagView.getUint8(0));
    } else {
      await reader.read(new Uint8Array(tag, 0, 8));
      bodyLength = tagView.getBigUint64(0, false);
    }
    bodyLength -= await this.deserializeNameFrom(reader);
    await this.deserializePropsFrom(reader, bodyLength);
  }
}
