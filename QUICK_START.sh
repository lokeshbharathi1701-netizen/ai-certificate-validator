#!/bin/bash
# Quick Start Script for CertVerify AI
# This script helps you get the app running in seconds

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        CertVerify AI - Quick Start Script                  ║"
echo "║     Certificate Verification System                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if all services are running
echo "🔍 Checking services..."
echo ""

# Check Flask
echo -n "  Flask ML API (http://localhost:5000): "
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ RUNNING"
else
    echo "❌ NOT RUNNING"
    echo "    Fix: Open terminal and run: cd ml && python app.py"
fi

# Check Node
echo -n "  Node.js Backend (http://localhost:3001): "
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ RUNNING"
else
    echo "❌ NOT RUNNING"
    echo "    Fix: Open terminal and run: cd server && npm start"
fi

# Check Frontend
echo -n "  React Frontend (http://localhost:5173): "
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ RUNNING"
else
    echo "❌ NOT RUNNING"
    echo "    Fix: Open terminal and run: cd client && npm run dev"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🚀 READY TO USE!                                          ║"
echo "║  Open browser: http://localhost:5173                       ║"
echo "║                                                            ║"
echo "║  Test Credentials:                                         ║"
echo "║  Email: test@test.com                                      ║"
echo "║  Password: test123                                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Steps:"
echo "  1. Login with credentials above"
echo "  2. Click 'Choose File' and select any image (JPG, PNG)"
echo "  3. Click 'Analyse Certificate'"
echo "  4. View results with confidence score"
echo "  5. Download report (optional)"
echo ""
