#!/bin/sh
sleep 5
node seed/seed.js || true
node server/index.js
