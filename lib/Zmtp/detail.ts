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

export const MAJOR = 3;
export const MINOR = 0;
export const AS_CLIENT = 0;
export const GREET_LENGTH = 64;
export const PARTIAL_LENGTH = 11;
export const MAX_SHORT_BODY_LEN = 0xFF;
export const PARTIAL_GREET = new Uint8Array([
// signature   padding(8)        end   major version
//  v   /--------------------\    v     v
  0xFF, 0, 0, 0, 0, 0, 0, 0, 1, 0x7F, MAJOR,
]);
