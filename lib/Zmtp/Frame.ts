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

import { encoder } from "../../deps.ts";
import { MAX_SHORT_BODY_LEN } from "./detail.ts";
import Zerializable from "./Zerializable.ts";

export interface FrameOptions {
  body?: Uint8Array | string;
  more?: boolean;
}

export default class Frame implements Zerializable {
  private static readonly SHORT_TAG = 0x00;
  private static readonly LONG_TAG = 0x02;

  public body: Uint8Array;
  public more: boolean;

  constructor({ body = new Uint8Array(), more = false }: FrameOptions = {}) {
    this.body = typeof body === "string" ? encoder.encode(body) : body;
    this.more = more;
  }

  serialize() {
    let ret: Uint8Array;
    let offset: number;
    if (this.body.length > MAX_SHORT_BODY_LEN) {
      offset = 9;
      ret = new Uint8Array(offset + this.body.byteLength);
      const view = new DataView(ret.buffer);
      view.setUint8(0, Frame.LONG_TAG);
      view.setBigUint64(1, BigInt(this.body.byteLength), false);
    } else {
      offset = 2;
      ret = new Uint8Array(offset + this.body.byteLength);
      ret[0] = Frame.SHORT_TAG;
      ret[1] = this.body.byteLength;
    }
    ret.set(this.body, offset);
    if (this.more) ret[0] |= 1;
    return ret;
  }

  async deserializeFrom(reader: Deno.Reader) {
    const meta = new ArrayBuffer(8);
    const metaView = new DataView(meta);
    await reader.read(new Uint8Array(meta, 0, 1));
    const tag = metaView.getUint8(0);
    this.more = !!(tag & 0x01);
    switch (tag & 0xfe) {
      case Frame.SHORT_TAG:
        await reader.read(new Uint8Array(meta, 0, 1));
        this.body = new Uint8Array(metaView.getUint8(0));
        break;
      case Frame.LONG_TAG:
        await reader.read(new Uint8Array(meta));
        this.body = new Uint8Array(Number(metaView.getBigUint64(0)));
        break;
      default:
        return null;
    }
    if (this.body.byteLength > 0) {
      await reader.read(this.body);
    }
  }
}
