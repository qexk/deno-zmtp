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

import Frame from "./Zmtp/Frame.ts";
import Zerializable from "./Zmtp/Zerializable.ts";

export default abstract class Zmtp {
  public abstract greet(): Promise<void>;
  public abstract handshake(): Promise<void>;
  public abstract send(data: Zerializable): Promise<void>;
  public abstract recv(): Promise<Frame[]>;
}
