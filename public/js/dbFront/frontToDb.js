export async function resetPoolFromFront() {
  const response = await fetch("/api/reset-pool", {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Échec du reset pool");
  }
  setLocalDBName(null);
  document.getElementById("current-db").innerHTML = "";
  return response.json();
}
