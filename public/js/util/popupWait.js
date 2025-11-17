export function waitLoading(message) {
  document.getElementById("waitLoading").style.display = "block";
  document.getElementById("waitLoading").innerHTML = message;
}

export function hideWaitLoading() {
  document.getElementById("waitLoading").style.display = "none";
}