#!/bin/bash
echo "Building Admin Panel..."
cd admin
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
npm run build -- --base=/admin/
cd ..

echo "Pushing changes to GitHub..."
git add .
git commit -m "Auto-deploy update"
git push

echo "Done! Vercel is now deploying your changes live."
