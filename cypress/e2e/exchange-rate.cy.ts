describe('API Endpoints', () => {
  describe('GET /api/health', () => {
    it('should respond with status ok', () => {
      cy.request('/api/health').then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('status', 'ok')
      })
    })

    it('should reject non-GET methods', () => {
      cy.request({
        method: 'POST',
        url: '/api/health',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(405)
      })
    })
  })

  describe('GET /api/summary', () => {
    describe('with mode=day', () => {
      it('should return daily data and summary', () => {
        cy.request('/api/summary?start=2024-01-01&end=2024-01-07&mode=day').then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property('days')
          expect(response.body).to.have.property('summary')
          expect(response.body.days).to.be.an('array').and.not.be.empty
          
          // Check summary structure
          expect(response.body.summary).to.have.property('start_rate')
          expect(response.body.summary).to.have.property('end_rate')
          expect(response.body.summary).to.have.property('total_pct_change')
          expect(response.body.summary).to.have.property('mean_rate')
        })
      })

      it('should return correct number of days', () => {
        cy.request('/api/summary?start=2024-01-01&end=2024-01-07&mode=day').then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.days).to.have.length(7)
        })
      })

      it('should include date, rate, and pct_change for each day', () => {
        cy.request('/api/summary?start=2024-01-01&end=2024-01-03&mode=day').then((response) => {
          expect(response.status).to.eq(200)
          
          response.body.days.forEach((day: any, index: number) => {
            expect(day).to.have.property('date')
            expect(day).to.have.property('rate')
            expect(day).to.have.property('pct_change')
            
            // First day should have null pct_change
            if (index === 0) {
              expect(day.pct_change).to.be.null
            }
          })
        })
      })

      it('should calculate percentage changes correctly', () => {
        cy.request('/api/summary?start=2024-01-01&end=2024-01-03&mode=day').then((response) => {
          expect(response.status).to.eq(200)
          const days = response.body.days
          
          // If we have rates, verify pct_change calculation
          if (days.length > 1 && days[0].rate && days[1].rate) {
            const expectedPctChange = ((days[1].rate - days[0].rate) / days[0].rate) * 100
            expect(days[1].pct_change).to.be.closeTo(expectedPctChange, 0.01)
          }
        })
      })
    })

    describe('with mode=none', () => {
      it('should return empty days array and summary only', () => {
        cy.request('/api/summary?start=2024-01-01&end=2024-01-07&mode=none').then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property('days')
          expect(response.body).to.have.property('summary')
          expect(response.body.days).to.be.an('array').that.is.empty
          
          // Summary should still be present
          expect(response.body.summary).to.have.property('start_rate')
          expect(response.body.summary).to.have.property('end_rate')
          expect(response.body.summary).to.have.property('total_pct_change')
          expect(response.body.summary).to.have.property('mean_rate')
        })
      })
    })

    describe('default mode', () => {
      it('should default to day mode when mode parameter is omitted', () => {
        cy.request('/api/summary?start=2024-01-01&end=2024-01-03').then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.days).to.be.an('array').and.not.be.empty
        })
      })
    })

    describe('error handling', () => {
      it('should return 400 when start parameter is missing', () => {
        cy.request({
          url: '/api/summary?end=2024-01-07',
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body).to.have.property('error')
        })
      })

      it('should return 400 when end parameter is missing', () => {
        cy.request({
          url: '/api/summary?start=2024-01-01',
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body).to.have.property('error')
        })
      })

      it('should return 400 when both parameters are missing', () => {
        cy.request({
          url: '/api/summary',
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body).to.have.property('error')
          expect(response.body.error).to.include('Missing required parameters')
        })
      })

      it('should return 400 for invalid mode', () => {
        cy.request({
          url: '/api/summary?start=2024-01-01&end=2024-01-07&mode=invalid',
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body).to.have.property('error')
        })
      })

      it('should reject non-GET methods', () => {
        cy.request({
          method: 'POST',
          url: '/api/summary?start=2024-01-01&end=2024-01-07',
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(405)
        })
      })

      it('should handle invalid date format', () => {
        cy.request({
          url: '/api/summary?start=invalid-date&end=2024-01-07',
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body).to.have.property('error')
        })
      })

      it('should handle start date after end date', () => {
        cy.request({
          url: '/api/summary?start=2024-01-07&end=2024-01-01',
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body).to.have.property('error')
        })
      })
    })

    describe('data validation', () => {
      it('should return valid EUR to USD exchange rates', () => {
        cy.request('/api/summary?start=2024-01-01&end=2024-01-07&mode=day').then((response) => {
          expect(response.status).to.eq(200)
          
          response.body.days.forEach((day: any) => {
            if (day.rate !== null) {
              // EUR to USD rate should be reasonable (between 0.5 and 2.0)
              expect(day.rate).to.be.greaterThan(0.5)
              expect(day.rate).to.be.lessThan(2.0)
            }
          })
        })
      })

      it('should calculate total percentage change correctly', () => {
        cy.request('/api/summary?start=2024-01-01&end=2024-01-07').then((response) => {
          expect(response.status).to.eq(200)
          const { summary } = response.body
          
          if (summary.start_rate && summary.end_rate) {
            const expectedTotalChange = ((summary.end_rate - summary.start_rate) / summary.start_rate) * 100
            expect(summary.total_pct_change).to.be.closeTo(expectedTotalChange, 0.01)
          }
        })
      })

      it('should calculate mean rate correctly', () => {
        cy.request('/api/summary?start=2024-01-01&end=2024-01-03&mode=day').then((response) => {
          expect(response.status).to.eq(200)
          const { days, summary } = response.body
          
          const validRates = days.filter((d: any) => d.rate !== null).map((d: any) => d.rate)
          if (validRates.length > 0) {
            const expectedMean = validRates.reduce((sum: number, rate: number) => sum + rate, 0) / validRates.length
            expect(summary.mean_rate).to.be.closeTo(expectedMean, 0.0001)
          }
        })
      })
    })
  })
})
