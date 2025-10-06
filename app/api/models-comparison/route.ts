import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const csvFile = path.join(process.cwd(), "api", "data", "models_comparison.csv")
    console.log("📊 Recherche du fichier CSV:", csvFile)

    // Vérifier si le fichier existe
    if (!fs.existsSync(csvFile)) {
      console.log("❌ Fichier CSV non trouvé")
      return NextResponse.json({
        success: true,
        models: [],
        message: "Fichier de comparaison non trouvé"
      })
    }

    // Lire le fichier CSV
    const csvContent = fs.readFileSync(csvFile, "utf-8")
    console.log("✅ Fichier CSV trouvé, taille:", csvContent.length, "caractères")

    // Nettoyer et parser le CSV
    const lines = csvContent.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (lines.length === 0) {
      console.log("❌ Fichier CSV vide")
      return NextResponse.json({
        success: true,
        models: [],
        message: "Fichier CSV vide"
      })
    }

    console.log("📋 Nombre de lignes CSV:", lines.length)

    // Extraire les en-têtes (première ligne)
    const headers = parseCSVLine(lines[0])
    console.log("🎯 En-têtes CSV détectés:", headers)

    // Parser les données (lignes suivantes)
    const modelsData = []
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i])
        const rowData: any = {}
        
        // Associer chaque valeur à son en-tête
        headers.forEach((header, index) => {
          if (index < values.length) {
            const value = values[index].trim()
            rowData[header] = convertValue(value)
          }
        })
        
        // Normaliser les noms pour notre application
        const modelName = 
          rowData.model_name || 
          rowData.Model || 
          rowData.name || 
          rowData['Model Name'] ||
          `Modèle_${i}`
        
        const modelData = {
          model_name: modelName,
          accuracy: getNumberValue(rowData, ['accuracy', 'Accuracy']),
          precision: getNumberValue(rowData, ['precision', 'Precision']),
          recall: getNumberValue(rowData, ['recall', 'Recall']),
          f1_macro: getNumberValue(rowData, ['f1_macro', 'f1-macro', 'F1 Macro', 'f1_macro_score']),
          f1_weighted: getNumberValue(rowData, ['f1_weighted', 'f1-weighted', 'F1 Weighted']),
          roc_auc: getNumberValue(rowData, ['roc_auc', 'roc-auc', 'ROC AUC', 'roc_auc_score']),
          auc_score: getNumberValue(rowData, ['auc_score', 'auc-score', 'AUC Score']),
          rank: getNumberValue(rowData, ['rank', 'Rank'], i),
          confusion_matrix: tryParseJson(rowData.confusion_matrix),
          hyperparameters: tryParseJson(rowData.hyperparameters || rowData.hyperparams)
        }
        
        modelsData.push(modelData)
        
      } catch (lineError) {
        console.warn(`⚠️ Erreur ligne ${i + 1}:`, lineError)
      }
    }

    console.log(`✅ ${modelsData.length} modèles chargés depuis CSV`)

    return NextResponse.json({
      success: true,
      models: modelsData,
      count: modelsData.length,
      source: "csv"
    })

  } catch (error) {
    console.error("💥 Erreur lecture CSV:", error)
    return NextResponse.json({
      success: false,
      models: [],
      error: "Erreur lors de la lecture du fichier CSV"
    }, { status: 500 })
  }
}

// Fonction pour parser une ligne CSV (gère les virgules dans les guillemets)
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  // Ajouter le dernier champ
  result.push(current)
  
  return result.map(field => field.replace(/^"|"$/g, '').trim())
}

// Fonction pour convertir les valeurs
function convertValue(value: string): any {
  if (!value || value === '') return null
  
  // Essayer de convertir en nombre
  const num = Number(value)
  if (!isNaN(num)) return num
  
  // Retourner la chaîne telle quelle
  return value
}

// Fonction pour obtenir une valeur numérique depuis différentes clés possibles
function getNumberValue(row: any, keys: string[], defaultValue: number = 0): number {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      const value = Number(row[key])
      if (!isNaN(value)) return value
    }
  }
  return defaultValue
}

// Fonction utilitaire pour parser le JSON en toute sécurité
function tryParseJson(str: any): any {
  if (!str || typeof str !== 'string') return null
  
  try {
    return JSON.parse(str)
  } catch {
    return str
  }
}