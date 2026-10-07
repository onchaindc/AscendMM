import { keccak256, toBytes } from "viem";

const ONCHAIN_RISK_LOW = "0x8de6751b28757f352028c28ce8c74e64bde406dc4c8e89281aa13677fbbdcafc";

const ids = {
  RISK_LOW: keccak256(toBytes("RISK_LOW")),
  RISK_MEDIUM: keccak256(toBytes("RISK_MEDIUM")),
  RISK_HIGH: keccak256(toBytes("RISK_HIGH")),
  RISK_EXPERIMENTAL: keccak256(toBytes("RISK_EXPERIMENTAL")),
};

console.log("keccak RISK_LOW        :", ids.RISK_LOW);
console.log("keccak RISK_MEDIUM     :", ids.RISK_MEDIUM);
console.log("keccak RISK_HIGH       :", ids.RISK_HIGH);
console.log("keccak RISK_EXPERIMENT.:", ids.RISK_EXPERIMENTAL);
console.log("on-chain RISK_LOW match:", ids.RISK_LOW === ONCHAIN_RISK_LOW);
if (ids.RISK_LOW !== ONCHAIN_RISK_LOW) process.exitCode = 1;

// Informational: identify the observed vaultType / strategyType slot values.
const VAULT_TYPE_HYPE = "0xd6cc70820711bfc47ebf16620b62f19093dc39166e5bda7e930a5f718097c2ac";
const VAULT_TYPE_ASMMT = "0x5d03986440236de464b6285820584ae946be429acfa1b06626a4e84ee2677246";
const STRATEGY_TYPE = "0x3ac40faa07bbb312b07d15cd479b3032d1a0ee606715e50fdece2e81fdac9e48";

for (const label of [
  "VAULT_NATIVE", "VAULT_ERC20", "VAULT_ERC4626", "NATIVE_VAULT", "HYPE_VAULT",
  "VAULT_HYPE", "VAULT_ASMMT", "ASMMT_VAULT", "VAULT_TYPE_NATIVE", "VAULT_TYPE_ERC20",
  "STRATEGY_IDLE", "IDLE", "STRATEGY_TYPE_IDLE", "IDLE_STRATEGY",
]) {
  const hash = keccak256(toBytes(label));
  if (hash === VAULT_TYPE_HYPE) console.log(`vaultType HYPE == keccak("${label}")`);
  if (hash === VAULT_TYPE_ASMMT) console.log(`vaultType asMMT == keccak("${label}")`);
  if (hash === STRATEGY_TYPE) console.log(`strategyType == keccak("${label}")`);
}
console.log("RISK_ID_CHECK_DONE");
