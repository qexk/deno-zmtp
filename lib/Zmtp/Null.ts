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

import { encoder } from '../../deps.ts';
import Zmtp from '../Zmtp.ts';
import Command from './Command.ts';
import {
  GREET_LENGTH,
  PARTIAL_GREET,
  PARTIAL_LENGTH,
  MINOR,
  AS_CLIENT,
} from './detail.ts';

export default class Null extends Zmtp {
  static GREET = (() => {
    const buf = new Uint8Array(GREET_LENGTH);
    buf.set(PARTIAL_GREET, 0);
    buf[11] = MINOR;
    encoder.encodeInto('NULL', buf.subarray(12));
    buf[32] = AS_CLIENT;
    return buf;
  })();

  constructor(
    public readonly sock: Deno.Conn
  ) {
    super();
  }

  async greet() {
    const rdbuf = new ArrayBuffer(GREET_LENGTH);
    await this.sock.write(Null.GREET.subarray(0, PARTIAL_LENGTH));
    await this.sock.read(new Uint8Array(rdbuf, 0, PARTIAL_LENGTH));
    await this.sock.write(Null.GREET.subarray(PARTIAL_LENGTH));
    await this.sock.read(new Uint8Array(rdbuf, PARTIAL_LENGTH));
  }

  async handshake() {
    const ready = new Command('READY', new Map([
      ['Socket-Type', 'REQ'],
      ['Identity', ''],
    ]));
    console.log('Sending', ready);
    await this.sock.write(ready.serialize());
    const recv = new Command();
    await recv.deserializeFrom(this.sock);
    console.log('Received', recv);
  }
}
