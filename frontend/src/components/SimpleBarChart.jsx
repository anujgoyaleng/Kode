import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function SimpleBarChart({ data }) {
	return (
		<div className="w-full h-56">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-black-700" />
					<XAxis dataKey="label" stroke="#6b7280" className="dark:stroke-black-400" />
					<YAxis domain={[0, 10]} stroke="#6b7280" className="dark:stroke-black-400" />
					<Tooltip 
						contentStyle={{ 
							backgroundColor: '#f9fafb', 
							border: '1px solid #e5e7eb', 
							borderRadius: '8px',
							'@media (prefers-color-scheme: dark)': {
								backgroundColor: '#171717',
								border: '1px solid #404040',
								color: '#ffffff'
							}
						}} 
						className="dark:bg-black-800 dark:border-black-700 dark:text-white"
					/>
					<Bar dataKey="value" fill="#2563eb" radius={[4,4,0,0]} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	)
}


