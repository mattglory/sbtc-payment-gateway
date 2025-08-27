;; sBTC Payment Gateway Smart Contract
;; This contract handles payment creation, processing, and completion

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-authorized (err u100))
(define-constant err-payment-not-found (err u101))
(define-constant err-payment-already-completed (err u102))
(define-constant err-insufficient-amount (err u103))
(define-constant err-invalid-merchant (err u104))

;; Data Variables
(define-data-var payment-counter uint u0)
(define-data-var contract-fee-percentage uint u250)

;; Data Maps
(define-map payments 
  { payment-id: (string-ascii 36) }
  { 
    merchant: principal,
    amount: uint,
    fee: uint,
    status: (string-ascii 20),
    customer: (optional principal),
    created-at: uint,
    completed-at: (optional uint),
    description: (optional (string-utf8 256))
  }
)

(define-map merchants
  { merchant: principal }
  {
    is-active: bool,
    total-payments: uint,
    total-volume: uint,
    created-at: uint
  }
)

;; Private Functions
(define-private (calculate-fee (amount uint))
  (/ (* amount (var-get contract-fee-percentage)) u10000)
)

;; Public Functions
(define-public (register-merchant)
  (let ((merchant tx-sender))
    (map-set merchants
      { merchant: merchant }
      {
        is-active: true,
        total-payments: u0,
        total-volume: u0,
        created-at: block-height
      }
    )
    (ok merchant)
  )
)

(define-public (create-payment-intent 
  (payment-id (string-ascii 36))
  (amount uint)
  (description (optional (string-utf8 256))))
  (let (
    (merchant tx-sender)
    (fee (calculate-fee amount))
  )
    (asserts! (is-some (map-get? merchants { merchant: merchant })) err-invalid-merchant)
    (asserts! (> amount u0) err-insufficient-amount)
    
    (map-set payments
      { payment-id: payment-id }
      {
        merchant: merchant,
        amount: amount,
        fee: fee,
        status: "pending",
        customer: none,
        created-at: block-height,
        completed-at: none,
        description: description
      }
    )
    
    (var-set payment-counter (+ (var-get payment-counter) u1))
    
    (ok {
      payment-id: payment-id,
      amount: amount,
      fee: fee,
      merchant: merchant
    })
  )
)

(define-public (process-payment 
  (payment-id (string-ascii 36)))
  (let (
    (customer tx-sender)
    (payment-data (unwrap! (map-get? payments { payment-id: payment-id }) err-payment-not-found))
  )
    (asserts! (is-eq (get status payment-data) "pending") err-payment-already-completed)
    
    (map-set payments
      { payment-id: payment-id }
      (merge payment-data {
        status: "completed",
        customer: (some customer),
        completed-at: (some block-height)
      })
    )
    
    (match (map-get? merchants { merchant: (get merchant payment-data) })
      merchant-data (map-set merchants
        { merchant: (get merchant payment-data) }
        (merge merchant-data {
          total-payments: (+ (get total-payments merchant-data) u1),
          total-volume: (+ (get total-volume merchant-data) (get amount payment-data))
        })
      )
      false
    )
    
    (print {
      event: "payment-completed",
      payment-id: payment-id,
      merchant: (get merchant payment-data),
      customer: customer,
      amount: (get amount payment-data),
      fee: (get fee payment-data)
    })
    
    (ok true)
  )
)

;; Read-only Functions
(define-read-only (get-payment (payment-id (string-ascii 36)))
  (map-get? payments { payment-id: payment-id })
)

(define-read-only (get-merchant (merchant principal))
  (map-get? merchants { merchant: merchant })
)

(define-read-only (is-merchant-registered (merchant principal))
  (match (map-get? merchants { merchant: merchant })
    merchant-data (get is-active merchant-data)
    false
  )
)

(define-read-only (get-contract-stats)
  {
    total-payments: (var-get payment-counter),
    fee-percentage: (var-get contract-fee-percentage)
  }
)