# Greydio Chain
This blockchain project is a WIP. TBD on details and documentation. For now this is meant to help document testing and running

## How to build and run:
### Install Rust
`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
### Validate it installed
```sh
rustc --version
cargo --version
```

### Build and run the project
`cargo clear`
`cargo build -p greydio-node`
`cargo run -p greydio-node`


## Documentation
# Greydio Node RPC API

This document describes the available RPC endpoints for the Greydio blockchain node, how to call them, and what their responses mean.

## Base URL

By default, the node listens on:


[http://127.0.0.1:8080](http://127.0.0.1:8080)


All examples below assume this base URL.

---

## **1. `/tip`**

**Method:** `POST`

**Description:**  
Returns the current block tip hash — the latest block header hash in the chain.

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8080/tip
````

**Example Response:**

```json
{
  "tip": [192,34,214,238,145,207,16,147,90,192,199,19,87,107,52,214,114,101,200,220,156,147,97,84,119,0,69,134,232,247,222,139]
}
```

**Meaning:**
The array is a 32-byte BLAKE3 hash of the latest block header.

---

## **2. `/height`**

**Method:** `POST`

**Description:**
Returns the current blockchain height.

**Example Request:**

```bash
curl -X POST http://127.0.0.1:8080/height
```

**Example Response:**

```json
{
  "height": 42
}
```

**Meaning:**
The height is the number of blocks in the chain so far (genesis block = height 0).

---

## **3. `/mempool_size`**

**Method:** `POST`

**Description:**
Returns the number of transactions currently queued in the mempool waiting to be included in a block.

**Example Request:**

```bash
curl -X POST http://127.0.0.1:8080/mempool_size
```

**Example Response:**

```json
{
  "queued": 5
}
```

**Meaning:**
A higher number indicates more pending transactions waiting for confirmation.

---

## **4. `/healthz`**

**Method:** `POST`

**Description:**
Returns a health summary of the node.

**Example Request:**

```bash
curl -X POST http://127.0.0.1:8080/healthz
```

**Example Response:**

```json
{
  "ok": true,
  "height": 42,
  "queued": 5,
  "last_block_ms_ago": 1200
}
```

**Field meanings:**

* **ok** – `true` if the node has produced a block in the last 10 seconds.
* **height** – Current blockchain height.
* **queued** – Current mempool size.
* **last\_block\_ms\_ago** – Milliseconds since the last block was produced (or `null` if no blocks yet).

---

## **5. `/metrics`**

**Method:** `POST`

**Description:**
Returns raw metrics for monitoring and instrumentation.

**Example Request:**

```bash
curl -X POST http://127.0.0.1:8080/metrics
```

**Example Response:**

```json
{
  "height": 42,
  "queued": 5,
  "last_block_ms_ago": 1200,
  "tip": "0xc022d6ee91cf10935ac0c713576b34d67265c8dc9c93615477004586e8f7de8b"
}
```

**Meaning:**
Use this for automated monitoring or dashboards. `tip` is returned as a hex string.

---

## **6. `/submit_tx`**

**Method:** `POST`

**Description:**
Queues a transaction for inclusion in the next block.

**Example Request:**

```bash
curl -X POST http://127.0.0.1:8080/submit_tx \
  -H "Content-Type: application/json" \
  -d '{"payload": {"type": "Transfer", "to": "alice", "amount": 10}}'
```

**Example Response:**

```json
{ "status": "queued" }
```

**Meaning:**
The transaction was accepted into the mempool. It will be processed when the next block is built.

---

## Notes

* All endpoints currently use `POST` for simplicity.
* All responses are JSON.
* Times are in **milliseconds since UNIX epoch** or relative in milliseconds where noted.

```

---

Do you want me to also add an **"API version"** field to `/healthz` and `/metrics` so consumers can detect changes in the response format automatically? That way this README will stay accurate even as we evolve the API.
```
