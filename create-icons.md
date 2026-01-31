# 图标创建说明

由于图标文件是占位符，您需要创建真实的图标文件。

## 方法1：使用在线工具
1. 访问 https://www.favicon-generator.org/ 或类似工具
2. 上传一个图标图片（建议 512x512）
3. 下载生成的图标文件
4. 将文件重命名为 icon16.png, icon48.png, icon128.png
5. 放到 public/icons/ 目录

## 方法2：使用 ImageMagick 或类似工具
```bash
# 创建一个简单的蓝色圆形图标
convert -size 128x128 xc:#00a1d6 -fill white -draw "circle 64,64 64,20" -pointsize 80 -gravity center -annotate +0+0 "CP" icon128.png
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png
```

## 临时解决方案
如果暂时没有图标，可以注释掉 manifest.json 中的图标配置，插件仍然可以工作。
