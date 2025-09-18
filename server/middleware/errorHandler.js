const errorHandler = (err, req, res, next) => {
  console.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  })

  // Handle specific error types
  if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
    return res.status(503).json({
      error: "Service temporarily unavailable",
      details: "Unable to connect to external service",
      code: "SERVICE_UNAVAILABLE",
    })
  }

  if (err.response && err.response.status) {
    const status = err.response.status
    if (status === 404) {
      return res.status(404).json({
        error: "Resource not found",
        details: "The requested resource could not be found",
        code: "NOT_FOUND",
      })
    }
    if (status === 403) {
      return res.status(403).json({
        error: "Access forbidden",
        details: "Access to the requested resource is forbidden",
        code: "FORBIDDEN",
      })
    }
    if (status >= 500) {
      return res.status(502).json({
        error: "External service error",
        details: "The external service returned an error",
        code: "EXTERNAL_SERVICE_ERROR",
      })
    }
  }

  // Default error response
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    code: "INTERNAL_ERROR",
  })
}

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    details: `The endpoint ${req.method} ${req.path} does not exist`,
    code: "ENDPOINT_NOT_FOUND",
  })
}

module.exports = { errorHandler, notFoundHandler }
