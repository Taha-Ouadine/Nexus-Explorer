"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { FEATURE_GROUPS, CLASS_MAPPING } from "@/lib/constants"

interface ResultsTabProps {
  lastPrediction: any
  feedbackGiven: boolean
  onFeedbackGiven: () => void
}

export default function ResultsTab({ lastPrediction, feedbackGiven, onFeedbackGiven }: ResultsTabProps) {
  if (!lastPrediction) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-12">
          <Alert className="bg-blue-600/20 border-blue-600">
            <AlertDescription className="text-white text-center">
              ℹ️ No recent prediction. Please make a prediction first in the 'Prediction' tab.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const probData =
    lastPrediction.probabilities?.map((prob: number, i: number) => ({
      classe: CLASS_MAPPING[i as keyof typeof CLASS_MAPPING],
      probabilité: prob,
    })) || []

  // Function to retrieve a feature value
  const getFeatureValue = (featureKey: string) => {
    // Essayer plusieurs sources possibles pour la valeur
    return lastPrediction.feature_values?.[featureKey] || 
           lastPrediction.features?.[getFeatureIndex(featureKey)] || 
           "N/A"
  }

  // Function to find the index of a feature
  const getFeatureIndex = (featureKey: string): number => {
    let index = 0
    for (const [groupName, groupFeatures] of Object.entries(FEATURE_GROUPS)) {
      for (const [key, name, min, max, defaultVal] of groupFeatures) {
        if (key === featureKey) {
          return index
        }
        index++
      }
    }
    return -1
  }

  // DEBUG: Display the data structure (remove in production)
  console.log("Last prediction:", lastPrediction)
  console.log("Feature values:", lastPrediction.feature_values)
  console.log("Features array:", lastPrediction.features)
  console.log("🔍 RESULTS - lastPrediction:", lastPrediction);
if (lastPrediction?.feature_values) {
  console.log("🔍 RESULTS - feature_values clés:", Object.keys(lastPrediction.feature_values));
  
  // Specifically check False Positive Flags
  const falsePositiveKeys = ['koi_fpflag_nt', 'koi_fpflag_ss', 'koi_fpflag_co'];
  falsePositiveKeys.forEach(key => {
    console.log(`🔍 RESULTS - ${key}:`, lastPrediction.feature_values[key]);
  });
}

  return (
    <div className="space-y-6">
      {/* Prediction Result */}
      <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <CardContent className="p-8 text-center">
          <h2 className="text-3xl font-bold mb-2">🎯 Prediction Result</h2>
          <h3 className="text-4xl font-bold mb-4">{lastPrediction.prediction_label}</h3>
          <p className="text-lg">
            <strong>Model used:</strong> {lastPrediction.model}
          </p>
          <p className="text-lg">
            <strong>Model type:</strong> {lastPrediction.model_type}
          </p>
        </CardContent>
      </Card>

      {/* Feature Values - CORRIGÉ */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">📋 Used Feature Values</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-2 text-slate-300">Group</th>
                  <th className="text-left p-2 text-slate-300">Feature</th>
                  <th className="text-right p-2 text-slate-300">Value</th>
                </tr>
              </thead>
              <tbody>
              {Object.entries(FEATURE_GROUPS).map(([groupName, groupFeatures]) =>
                groupFeatures.map(([key, name, min, max, defaultVal]) => (
                  <tr key={key} className="border-b border-slate-700/50">
                    <td className="p-2 text-slate-400">{groupName}</td>
                    <td className="p-2 text-white">{name}</td>
                    <td className="p-2 text-right text-white">
                      {lastPrediction.feature_values[key]?.toFixed(6) || "N/A"} {/* ← PROBLEME ICI */}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
            </table>
          </div>

          {/* DEBUG: Show available keys (remove in production) */}
{process.env.NODE_ENV === 'development' && lastPrediction.feature_values && (
  <div className="mt-4 p-4 bg-slate-900 rounded-lg">
    <p className="text-sm text-slate-400 mb-2">Debug - Keys available in feature_values:</p>
    <div className="text-xs text-slate-300">
      {Object.keys(lastPrediction.feature_values).map(key => (
        <div key={key}>
          {key}: {lastPrediction.feature_values[key]}
        </div>
      ))}
    </div>
    
    {/* ⬇️ ADD THIS SECTION FOR MODEL RESULTS ⬇️ */}
    <div className="mt-4 pt-4 border-t border-slate-700">
      <p className="text-sm text-slate-400 mb-2">Debug - Model results:</p>
      <div className="text-xs text-slate-300 space-y-1">
        <div><strong>Model used:</strong> {lastPrediction.model}</div>
        <div><strong>Model type:</strong> {lastPrediction.model_type}</div>
        <div><strong>Prediction:</strong> {lastPrediction.prediction} ({lastPrediction.prediction_label})</div>
        {lastPrediction.probabilities && (
          <>
            <div><strong>Probabilities:</strong></div>
            <div className="ml-2">
              {lastPrediction.probabilities.map((prob: number, index: number) => (
                <div key={index}>
                  - {CLASS_MAPPING[index as keyof typeof CLASS_MAPPING]}: {(prob * 100).toFixed(2)}%
                </div>
              ))}
            </div>
            <div><strong>Sum probabilities:</strong> {lastPrediction.probabilities.reduce((a: number, b: number) => a + b, 0).toFixed(6)}</div>
          </>
        )}
        <div><strong>Number of features:</strong> {lastPrediction.features?.length || 0}</div>
        {lastPrediction.original_model_requested && (
          <div><strong>Requested model:</strong> {lastPrediction.original_model_requested}</div>
        )}
      </div>
    </div>
  </div>
)}
        </CardContent>
      </Card>

      {/* Probabilities Chart */}
      {lastPrediction.probabilities && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">📊 Probabilities by Class</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={probData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="classe" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value) => [`${(Number(value) * 100).toFixed(2)}%`, "Probability"]}
                />
                <Bar dataKey="probabilité" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {probData.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-white">
                  <span>{item.classe}</span>
                  <span className="font-bold">{(item.probabilité * 100).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback Section */}
      {!feedbackGiven && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
          <CardTitle className="text-white">💬 Prediction Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 mb-4">Does this prediction look correct to you?</p>
            <div className="grid grid-cols-3 gap-4">
              <Button onClick={onFeedbackGiven} className="bg-green-600 hover:bg-green-700">
                👍 Correct
              </Button>
              <Button onClick={onFeedbackGiven} className="bg-red-600 hover:bg-red-700">
                👎 Incorrect
              </Button>
              <Button onClick={onFeedbackGiven} className="bg-yellow-600 hover:bg-yellow-700">
                🤔 Unsure
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {feedbackGiven && (
        <Alert className="bg-green-600/20 border-green-600">
          <AlertDescription className="text-white">✅ Feedback already provided for this prediction.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}