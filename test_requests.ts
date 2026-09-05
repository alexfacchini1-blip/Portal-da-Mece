import fetch from "node-fetch";

async function run() {
  try {
    const paroquiaQuery = "?paroquia=Paróquia%20Santa%20Rita%20de%20Cássia";
    
    console.log("Fetching config...");
    const req1 = await fetch(`http://localhost:3000/api/config${paroquiaQuery}`);
    console.log("Config OK:", req1.ok, await req1.text().catch(() => "err"));

    console.log("Fetching pending...");
    const req2 = await fetch(`http://localhost:3000/api/admin/pending${paroquiaQuery}`);
    console.log("Pending OK:", req2.ok, await req2.text().catch(() => "err"));

    console.log("Fetching coordinators...");
    const req3 = await fetch(`http://localhost:3000/api/admin/coordinators${paroquiaQuery}`);
    console.log("Coordinators OK:", req3.ok, await req3.text().catch(() => "err"));

    console.log("Fetching ministros...");
    const req4 = await fetch(`http://localhost:3000/api/admin/ministros${paroquiaQuery}`);
    console.log("Ministros OK:", req4.ok, (await req4.text().catch(() => "err")).substring(0, 100));

    console.log("Fetching paroquias...");
    const req5 = await fetch(`http://localhost:3000/api/paroquias`);
    console.log("Paroquias OK:", req5.ok, (await req5.text().catch(() => "err")).substring(0, 100));

  } catch (err) {
    console.error(err);
  }
}
run();
