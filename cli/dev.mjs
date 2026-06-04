#!/usr/bin/env node

import { route } from "./core/router.mjs";

const exitCode = await route(process.argv.slice(2));
process.exitCode = exitCode;
