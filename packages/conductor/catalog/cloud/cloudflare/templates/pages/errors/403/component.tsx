/**
 * 403 Forbidden Error Page
 */

export default function Error403() {
	return (
		<div style={{
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			minHeight: '100vh',
			padding: '2rem',
			fontFamily: 'system-ui, -apple-system, sans-serif',
			backgroundColor: '#f8f9fa'
		}}>
			<div style={{
				textAlign: 'center',
				maxWidth: '600px'
			}}>
				{/* Error Code */}
				<h1 style={{
					fontSize: '8rem',
					margin: 0,
					fontWeight: 700,
					color: '#dc3545',
					lineHeight: 1
				}}>
					403
				</h1>

				{/* Error Message */}
				<h2 style={{
					fontSize: '2rem',
					margin: '1rem 0',
					fontWeight: 600,
					color: '#212529'
				}}>
					Access Forbidden
				</h2>

				<p style={{
					fontSize: '1.125rem',
					color: '#6c757d',
					marginBottom: '2rem',
					lineHeight: 1.6
				}}>
					You don't have permission to access this resource. If you believe this is an error, please contact your administrator.
				</p>

				{/* Actions */}
				<div style={{
					display: 'flex',
					gap: '1rem',
					justifyContent: 'center',
					flexWrap: 'wrap'
				}}>
					<a
						href="/"
						style={{
							display: 'inline-block',
							padding: '0.75rem 2rem',
							backgroundColor: '#007bff',
							color: 'white',
							textDecoration: 'none',
							borderRadius: '0.5rem',
							fontWeight: 500,
							transition: 'background-color 0.2s'
						}}
						onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
						onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
					>
						Go Home
					</a>

					<a
						href="/login"
						style={{
							display: 'inline-block',
							padding: '0.75rem 2rem',
							backgroundColor: 'white',
							color: '#007bff',
							textDecoration: 'none',
							borderRadius: '0.5rem',
							fontWeight: 500,
							border: '2px solid #007bff',
							transition: 'all 0.2s'
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.backgroundColor = '#007bff';
							e.currentTarget.style.color = 'white';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.backgroundColor = 'white';
							e.currentTarget.style.color = '#007bff';
						}}
					>
						Log In
					</a>
				</div>

				{/* Additional Info */}
				<p style={{
					marginTop: '3rem',
					fontSize: '0.875rem',
					color: '#adb5bd'
				}}>
					Error Code: 403 | Access Denied
				</p>
			</div>
		</div>
	);
}
