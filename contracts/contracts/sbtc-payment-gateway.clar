;; sBTC Payment Gateway Smart Contract
;; Built for Stacks Builders Competition
;; Handles secure payment processing and merchant management

;; Error Constants
(define-constant err-owner-only (err u100))
(define-constant err-invalid-payment (err u101))
(define-constant err-payment-not-found (err u102))
(define-constant err-unauthorized (err u103))
(define-constant err-payment-expired (err u104))
(define-constant err-payment-already-processed (err u105))
(define-constant err-merchant-already-registered (err u106))
(define-constant err-invalid-business-name (err u107))
(define-constant err-invalid-email (err u108))
(define-constant err-payment-id-exists (err u109))
;; Input validation error constants
(define-constant err-invalid-payment-id (err u400))
(define-constant err-invalid-description (err u401))
(define-constant err-invalid-amount (err u403))

;; Contract Constants
(define-constant contract-owner tx-sender)
(define-constant max-fee-percentage u1000) ;; 10% maximum fee

;; Data Variables
(define-data-var fee-percentage uint u250) ;; 2.5% default fee (250 basis points)
(define-data-var total-payments-processed uint u0)
(define-data-var total-volume-processed uint u0)

;; Data Maps
(define-map merchants principal {
  business-name: (string-ascii 100),
  email: (string-ascii 100),
  is-active: bool,
  total-processed: uint,
  fee-collected: uint,
  payments-count: uint,
  registered-at: uint
})

(define-map payments {payment-id: (string-ascii 64)} {
  merchant: principal,
  amount: uint,
  fee: uint,
  status: (string-ascii 20),
  customer: (optional principal),
  description: (optional (string-ascii 255)),
  created-at: uint,
  expires-at: uint,
  processed-at: (optional uint)
})

(define-map payment-status (string-ascii 64) (string-ascii 20))

;; Merchant registration and management
(define-public (register-merchant (business-name (string-ascii 100)) (email (string-ascii 100)))
  (let ((current-block block-height))
    ;; Input validation
    (asserts! (and (> (len business-name) u0) (<= (len business-name) u100)) err-invalid-business-name)
    (asserts! (and (> (len email) u0) (<= (len email) u100)) err-invalid-email)
    (asserts! (is-none (map-get? merchants tx-sender)) err-merchant-already-registered)
    
    (map-set merchants tx-sender {
      business-name: business-name,
      email: email,
      is-active: true,
      total-processed: u0,
      fee-collected: u0,
      payments-count: u0,
      registered-at: current-block
    })
    (ok true)
  )
)

;; Create a new payment intent
(define-public (create-payment-intent 
  (payment-id (string-ascii 64))
  (amount uint)
  (description (optional (string-ascii 255)))
  (expires-in-blocks uint))
  (let (
    (current-block block-height)
    (expires-at (+ current-block expires-in-blocks))
    (fee (/ (* amount (var-get fee-percentage)) u10000))
    (merchant-data (unwrap! (map-get? merchants tx-sender) err-unauthorized))
  )
    ;; Input validations
    (asserts! (and (> (len payment-id) u0) (<= (len payment-id) u64)) err-invalid-payment-id)
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (> expires-in-blocks u0) err-invalid-payment)
    (asserts! (get is-active merchant-data) err-unauthorized)
    (asserts! (is-none (map-get? payments {payment-id: payment-id})) err-payment-id-exists)
    
    ;; Validate description if provided - simplified approach
    (if (is-some description)
      (let ((desc-value (unwrap-panic description)))
        (asserts! (and (> (len desc-value) u0) (<= (len desc-value) u255)) err-invalid-description))
      true)
    
    ;; Create payment intent
    (map-set payments 
      {payment-id: payment-id}
      {
        merchant: tx-sender,
        amount: amount,
        fee: fee,
        status: "pending",
        customer: none,
        description: description,
        created-at: current-block,
        expires-at: expires-at,
        processed-at: none
      }
    )
    (map-set payment-status payment-id "pending")
    (ok {
      payment-id: payment-id, 
      amount: amount, 
      fee: fee, 
      expires-at: expires-at,
      merchant: tx-sender
    })
  )
)

;; Process a payment (complete the transaction)
(define-public (process-payment 
  (payment-id (string-ascii 64))
  (customer-address principal))
  (let (
    (payment-data (unwrap! (map-get? payments {payment-id: payment-id}) err-payment-not-found))
    (amount (get amount payment-data))
    (fee (get fee payment-data))
    (merchant (get merchant payment-data))
    (current-block block-height)
  )
    ;; Input validation
    (asserts! (and (> (len payment-id) u0) (<= (len payment-id) u64)) err-invalid-payment-id)
    
    ;; Payment validations
    (asserts! (is-eq (get status payment-data) "pending") err-payment-already-processed)
    (asserts! (< current-block (get expires-at payment-data)) err-payment-expired)
    
    ;; Update payment status
    (map-set payments 
      {payment-id: payment-id}
      (merge payment-data {
        status: "completed",
        customer: (some customer-address),
        processed-at: (some current-block)
      })
    )
    (map-set payment-status payment-id "completed")
    
    ;; Update merchant statistics
    (match (map-get? merchants merchant)
      merchant-data (map-set merchants merchant
        (merge merchant-data {
          total-processed: (+ (get total-processed merchant-data) amount),
          fee-collected: (+ (get fee-collected merchant-data) fee),
          payments-count: (+ (get payments-count merchant-data) u1)
        }))
      false
    )
    
    ;; Update global statistics
    (var-set total-payments-processed (+ (var-get total-payments-processed) u1))
    (var-set total-volume-processed (+ (var-get total-volume-processed) amount))
    
    ;; Emit event for external systems
    (print {
      event: "payment-completed",
      payment-id: payment-id,
      amount: amount,
      fee: fee,
      merchant: merchant,
      customer: customer-address,
      block-height: current-block
    })
    
    (ok {
      payment-id: payment-id, 
      status: "completed", 
      amount: amount,
      customer: customer-address,
      processed-at: current-block
    })
  )
)

;; Cancel a payment (merchant only)
(define-public (cancel-payment (payment-id (string-ascii 64)))
  (let (
    (payment-data (unwrap! (map-get? payments {payment-id: payment-id}) err-payment-not-found))
    (current-block block-height)
  )
    ;; Input validation
    (asserts! (and (> (len payment-id) u0) (<= (len payment-id) u64)) err-invalid-payment-id)
    
    ;; Authorization and status validations
    (asserts! (is-eq tx-sender (get merchant payment-data)) err-unauthorized)
    (asserts! (is-eq (get status payment-data) "pending") err-payment-already-processed)
    
    ;; Update payment status
    (map-set payments 
      {payment-id: payment-id}
      (merge payment-data {
        status: "cancelled",
        processed-at: (some current-block)
      })
    )
    (map-set payment-status payment-id "cancelled")
    
    ;; Emit event
    (print {
      event: "payment-cancelled",
      payment-id: payment-id,
      merchant: tx-sender,
      block-height: current-block
    })
    
    (ok true)
  )
)

;; Read-only functions for data access

(define-read-only (get-payment (payment-id (string-ascii 64)))
  (map-get? payments {payment-id: payment-id})
)

(define-read-only (get-payment-status (payment-id (string-ascii 64)))
  (map-get? payment-status payment-id)
)

(define-read-only (get-merchant (merchant-address principal))
  (map-get? merchants merchant-address)
)

(define-read-only (get-fee-percentage)
  (var-get fee-percentage)
)

(define-read-only (get-platform-stats)
  {
    total-payments: (var-get total-payments-processed),
    total-volume: (var-get total-volume-processed),
    current-fee-percentage: (var-get fee-percentage)
  }
)

;; Check if payment is expired
(define-read-only (is-payment-expired (payment-id (string-ascii 64)))
  (match (map-get? payments {payment-id: payment-id})
    payment-data (> block-height (get expires-at payment-data))
    false
  )
)

;; Admin functions (contract owner only)

(define-public (set-fee-percentage (new-fee uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (<= new-fee max-fee-percentage) err-invalid-payment)
    (var-set fee-percentage new-fee)
    (ok true)
  )
)

(define-public (deactivate-merchant (merchant-address principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    ;; Validate merchant address is not the contract itself
    (asserts! (not (is-eq merchant-address (as-contract tx-sender))) err-unauthorized)
    ;; Validate merchant exists and get their data
    (match (map-get? merchants merchant-address)
      merchant-data (begin
        (map-set merchants merchant-address
          (merge merchant-data {is-active: false}))
        (ok true))
      err-unauthorized
    )
  )
)

(define-public (reactivate-merchant (merchant-address principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    ;; Validate merchant address is not the contract itself
    (asserts! (not (is-eq merchant-address (as-contract tx-sender))) err-unauthorized)
    ;; Validate merchant exists and get their data
    (match (map-get? merchants merchant-address)
      merchant-data (begin
        (map-set merchants merchant-address
          (merge merchant-data {is-active: true}))
        (ok true))
      err-unauthorized
    )
  )
)