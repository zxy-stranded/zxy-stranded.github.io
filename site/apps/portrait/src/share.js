import QRCode from "qrcode";
import { invitationUrl, personalityTags, dimensions } from "./engine.js";
const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片生成失败"));
    image.src = src;
  });
function wrapped(ctx, text, x, y, maxWidth, lineHeight) {
  let line = "";
  for (const char of text) {
    if (ctx.measureText(line + char).width > maxWidth) {
      ctx.fillText(line, x, y);
      line = char;
      y += lineHeight;
    } else line += char;
  }
  if (line) ctx.fillText(line, x, y);
  return y;
}
export async function createShareCard(result, href) {
  const f = result.primary.figure,
    link = invitationUrl(f.id, href),
    canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("当前浏览器暂不支持图片绘制");
  c.fillStyle = "#f2f0e8";
  c.fillRect(0, 0, 1080, 1440);
  c.fillStyle = "#fbfaf5";
  c.fillRect(40, 40, 1000, 1360);
  c.strokeStyle = "#d6dccd";
  c.strokeRect(40, 40, 1000, 1360);
  c.fillStyle = "#73816c";
  c.font = "22px sans-serif";
  c.textAlign = "center";
  c.fillText("观 己  /  YOUR HISTORICAL PORTRAIT", 540, 105);
  c.font = "24px sans-serif";
  c.fillStyle = "#87759f";
  c.fillText(personalityTags(result.vec).join("  ·  "), 540, 175);
  c.fillStyle = "#e6eadb";
  c.beginPath();
  c.arc(540, 289, 70, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#657f60";
  c.beginPath();
  c.arc(540, 272, 26, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(490, 337);
  c.quadraticCurveTo(496, 295, 540, 302);
  c.quadraticCurveTo(585, 295, 591, 337);
  c.fill();
  c.font = "bold 86px serif";
  c.fillStyle = "#29483a";
  c.fillText(f.name, 540, 444);
  c.font = "32px serif";
  c.fillStyle = "#65735d";
  wrapped(c, f.verdict, 540, 513, 860, 49);
  c.fillStyle = "#eeebf3";
  c.fillRect(100, 644, 880, 118);
  c.fillStyle = "#8370a5";
  c.font = "bold 45px sans-serif";
  c.fillText(`${result.total} 道情境中，${result.count} 题倾向吻合`, 540, 701);
  c.font = "21px sans-serif";
  c.fillText("与你匹配的是编辑画像，并非历史人物的真实答卷", 540, 738);
  c.textAlign = "left";
  c.fillStyle = "#344f3e";
  c.font = "25px sans-serif";
  c.fillText("八维选择切面", 100, 823);
  for (let i = 0; i < 8; i++) {
    const column = i >= 4 ? 1 : 0,
      row = i % 4,
      x = 100 + column * 455,
      y = 872 + row * 51;
    c.font = "22px sans-serif";
    c.fillStyle = "#79846f";
    c.fillText(dimensions[i].name, x, y);
    c.fillStyle = "#e2e5da";
    c.fillRect(x + 121, y - 15, 240, 8);
    c.fillStyle = "#6e8966";
    c.fillRect(x + 121, y - 15, (240 * result.vec[i]) / 10, 8);
  }
  c.strokeStyle = "#dde0d4";
  c.beginPath();
  c.moveTo(100, 1080);
  c.lineTo(980, 1080);
  c.stroke();
  const qr = await QRCode.toDataURL(link, {
    width: 190,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#29483a", light: "#fbfaf5" },
  });
  c.drawImage(await loadImage(qr), 764, 1120, 190, 190);
  c.fillStyle = "#3c5945";
  c.font = "31px serif";
  c.fillText("你会与谁相遇？", 100, 1173);
  c.font = "23px sans-serif";
  c.fillStyle = "#7d8774";
  c.fillText("50 位人物 · 10 种原型", 100, 1221);
  c.fillText("扫描二维码，开启你的探索。", 100, 1261);
  c.textAlign = "center";
  c.fillStyle = "#9a9e90";
  c.font = "20px sans-serif";
  c.fillText("娱乐性自我探索 · 不构成心理测量或完整历史评价", 540, 1362);
  return { image: canvas.toDataURL("image/png"), link };
}
