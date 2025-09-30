import { useEffect, useState } from 'react'
import api from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'

export default function AchievementsPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [data, setData] = useState(null)
    const [certificates, setCertificates] = useState([])

    useEffect(() => {
        (async () => {
            setLoading(true)
            setError(null)
            try {
                let sid = user?.studentId
                if (!sid) {
                    const me = await api.get('/auth/me')
                    sid = me.data?.data?.user?.studentId
                }
                if (!sid) {
                    setError('No student record found')
                    return
                }
                const res = await api.get(`/students/${sid}`)
                setData(res.data.data)
            } catch (e) {
                setError('Failed to load achievements')
            } finally {
                setLoading(false)
            }
        })()
    }, [user?.studentId])

    // Fetch certificates list (if not present on profile response)
    useEffect(() => {
        (async () => {
            try {
                if (!data?.student?.id) return
                if (!data.certificates) {
                    const res = await api.get(`/students/${data.student.id}`)
                    const certs = res.data?.data?.certificates || []
                    setCertificates(certs)
                } else {
                    setCertificates(data.certificates)
                }
            } catch {}
        })()
    }, [data?.student?.id])

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-pureblack flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading achievements...</p>
            </div>
        </div>
    )

    if (error) return (
        <div className="min-h-screen bg-gray-50 dark:bg-pureblack flex items-center justify-center">
            <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
            </div>
        </div>
    )

    const achievements = data?.academicAchievements || []
    const activities = data?.extracurricularActivities || []
    const projects = data?.projects || []
    const rawSkills = data?.skills || []
    const skills = rawSkills.map(s => s?.skillName || s?.name || (typeof s === 'string' ? s : '')).filter(Boolean)

    const Section = ({ title, children }) => (
        <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h2>
            {children}
        </div>
    )

    const StatusPill = ({ isVerified, verifiedBy }) => {
        const status = isVerified === true ? 'Approved' : (isVerified === false && verifiedBy ? 'Rejected' : 'Pending')
        const cls = status === 'Approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : status === 'Rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
        return <span className={`text-xs px-2 py-1 rounded-full font-medium ${cls}`}>{status}</span>
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-pureblack w-full px-4 md:px-8">
            <div className="py-6 max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Achievements</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">All your achievements organized in one place</p>
                    </div>
                </div>

                <Section title="Skills">
                    {skills.length === 0 ? (
                        <div className="text-sm text-gray-600 dark:text-gray-400">No skills added yet.</div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {(data?.skills || []).map((s, idx) => {
                                const label = s?.skillName || s?.name || (typeof s === 'string' ? s : '')
                                return (
                                    <span key={`${label}-${idx}`} className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 dark:bg-accent-900/30 text-primary-700 dark:text-accent-300 rounded-full text-sm font-medium">
                                        {label}
                                        {s?.id && (
                                            <DeleteSkillButton studentId={data?.student?.id} skillId={s.id} onDeleted={()=>{
                                                setData(prev=>({
                                                    ...prev,
                                                    skills: (prev?.skills || []).filter(x=>x.id!==s.id)
                                                }))
                                            }} />
                                        )}
                                    </span>
                                )
                            })}
                        </div>
                    )}
                </Section>

                <Section title="Certificates">
                    {certificates.length === 0 ? (
                        <div className="text-sm text-gray-600 dark:text-gray-400">No certificates added yet.</div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {certificates.map(c => (
                                <div key={c.id} className="p-3 rounded-lg bg-gray-50 dark:bg-black-800 border border-gray-200 dark:border-black-700">
                                    <div className="font-medium text-gray-900 dark:text-white mb-2 truncate" title={c.originalName || c.filename}>{c.originalName || c.filename}</div>
                                    {c.fileUrl && (
                                        <img src={c.fileUrl} alt={c.originalName || 'Certificate'} className="w-full max-h-48 object-contain rounded bg-white dark:bg-black-900 border border-gray-200 dark:border-black-700" loading="lazy" />
                                    )}
                                    <div className="mt-2"><StatusPill isVerified={c.isVerified} verifiedBy={c.verifiedBy} /></div>
                                    <div className="mt-2 flex items-center justify-end gap-2">
                                        <DeleteCertificateButton id={c.id} onDeleted={()=>{ setCertificates(prev=>prev.filter(x=>x.id!==c.id)) }} />
                                        <FeatureToggle type="certificate" id={c.id} initial={!!c.isFeatured} onChanged={v=>{ setCertificates(prev=>prev.map(x=>x.id===c.id?{...x,isFeatured:v}:x)) }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                <Section title="Achievements">
                    {achievements.length === 0 ? (
                        <div className="text-sm text-gray-600 dark:text-gray-400">No achievements added yet.</div>
                    ) : (
                        <div className="space-y-3">
                            {achievements.map(a => (
                                <div key={a.id} className="p-3 rounded-lg bg-gray-50 dark:bg-black-800 border border-gray-200 dark:border-black-700">
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium text-gray-900 dark:text-white">{a.title} {a.year ? `- ${a.year}` : ''}</div>
                                        <StatusPill isVerified={a.isVerified} verifiedBy={a.verifiedBy} />
                                    </div>
                                    {a.description && <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{a.description}</div>}
                                    <div className="mt-2 flex items-center justify-end gap-2">
                                        <DeleteAchievementButton
                                            studentId={data?.student?.id}
                                            achievementId={a.id}
                                            onDeleted={() => {
                                                setData(prev => ({
                                                    ...prev,
                                                    academicAchievements: (prev?.academicAchievements || []).filter(x => x.id !== a.id)
                                                }))
                                            }}
                                        />
                                        <FeatureToggle type="achievement" id={a.id} initial={!!a.isFeatured} onChanged={(v)=>{
                                            setData(prev=>({
                                                ...prev,
                                                academicAchievements: (prev?.academicAchievements||[]).map(x=>x.id===a.id?{...x,isFeatured:v}:x)
                                            }))
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                <Section title="Projects">
                    {projects.length === 0 ? (
                        <div className="text-sm text-gray-600 dark:text-gray-400">No projects added yet.</div>
                    ) : (
                        <div className="space-y-3">
                            {projects.map(p => (
                                <div key={p.id} className="p-3 rounded-lg bg-gray-50 dark:bg-black-800 border border-gray-200 dark:border-black-700">
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium text-gray-900 dark:text-white">{p.title}</div>
                                        <StatusPill isVerified={p.isVerified} verifiedBy={p.verifiedBy} />
                                    </div>
                                    {p.description && <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{p.description}</div>}
                                    <div className="flex gap-3 mt-2 text-sm">
                                        {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">GitHub</a>}
                                        {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">Live</a>}
                                    </div>
                                    <div className="mt-2 flex items-center justify-end gap-2">
                                        <DeleteProjectButton studentId={data?.student?.id} projectId={p.id} onDeleted={()=>{
                                            setData(prev=>({
                                                ...prev,
                                                projects: (prev?.projects || []).filter(x=>x.id!==p.id)
                                            }))
                                        }} />
                                        <FeatureToggle type="project" id={p.id} initial={!!p.isFeatured} onChanged={(v)=>{
                                            setData(prev=>({
                                                ...prev,
                                                projects: (prev?.projects||[]).map(x=>x.id===p.id?{...x,isFeatured:v}:x)
                                            }))
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                <Section title="Activities">
                    {activities.length === 0 ? (
                        <div className="text-sm text-gray-600 dark:text-gray-400">No activities added yet.</div>
                    ) : (
                        <div className="space-y-3">
                            {activities.map(ac => (
                                <div key={ac.id} className="p-3 rounded-lg bg-gray-50 dark:bg-black-800 border border-gray-200 dark:border-black-700">
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium text-gray-900 dark:text-white">{ac.title}</div>
                                        <StatusPill isVerified={ac.isVerified} verifiedBy={ac.verifiedBy} />
                                    </div>
                                    {ac.description && <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{ac.description}</div>}
                                    <div className="mt-2 flex items-center justify-end gap-2">
                                        <DeleteActivityButton studentId={data?.student?.id} activityId={ac.id} onDeleted={()=>{
                                            setData(prev=>({
                                                ...prev,
                                                extracurricularActivities: (prev?.extracurricularActivities || []).filter(x=>x.id!==ac.id)
                                            }))
                                        }} />
                                        <FeatureToggle type="activity" id={ac.id} initial={!!ac.isFeatured} onChanged={(v)=>{
                                            setData(prev=>({
                                                ...prev,
                                                extracurricularActivities: (prev?.extracurricularActivities||[]).map(x=>x.id===ac.id?{...x,isFeatured:v}:x)
                                            }))
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            </div>
        </div>
    )
}

function FeatureToggle({ type, id, initial, onChanged }) {
    const [loading, setLoading] = useState(false)
    const [value, setValue] = useState(!!initial)
    const toggle = async () => {
        setLoading(true)
        try {
            await api.put(`/students/feature/${type}/${id}`, { isFeatured: !value })
            setValue(!value)
            onChanged && onChanged(!value)
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to update feature flag')
        } finally {
            setLoading(false)
        }
    }
    return (
        <button onClick={toggle} disabled={loading} className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-black-600 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-black-700">
            {loading ? 'Saving...' : value ? '★ Featured' : '☆ Feature on Dashboard'}
        </button>
    )
}

function DeleteAchievementButton({ studentId, achievementId, onDeleted }) {
    const [loading, setLoading] = useState(false)
    const remove = async () => {
        if (!studentId || !achievementId) return
        const ok = window.confirm('Delete this achievement? This cannot be undone.')
        if (!ok) return
        setLoading(true)
        try {
            await api.delete(`/students/${studentId}/achievements/${achievementId}`)
            onDeleted && onDeleted()
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to delete achievement')
        } finally {
            setLoading(false)
        }
    }
    return (
        <button onClick={remove} disabled={loading} className="text-xs px-2 py-1 rounded border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
            {loading ? 'Deleting...' : 'Delete'}
        </button>
    )
}

function DeleteProjectButton({ studentId, projectId, onDeleted }) {
    const [loading, setLoading] = useState(false)
    const remove = async () => {
        if (!studentId || !projectId) return
        if (!window.confirm('Delete this project?')) return
        setLoading(true)
        try {
            await api.delete(`/students/${studentId}/projects/${projectId}`)
            onDeleted && onDeleted()
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to delete project')
        } finally {
            setLoading(false)
        }
    }
    return (
        <button onClick={remove} disabled={loading} className="text-xs px-2 py-1 rounded border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
            {loading ? 'Deleting...' : 'Delete'}
        </button>
    )
}

function DeleteActivityButton({ studentId, activityId, onDeleted }) {
    const [loading, setLoading] = useState(false)
    const remove = async () => {
        if (!studentId || !activityId) return
        if (!window.confirm('Delete this activity?')) return
        setLoading(true)
        try {
            await api.delete(`/students/${studentId}/activities/${activityId}`)
            onDeleted && onDeleted()
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to delete activity')
        } finally {
            setLoading(false)
        }
    }
    return (
        <button onClick={remove} disabled={loading} className="text-xs px-2 py-1 rounded border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
            {loading ? 'Deleting...' : 'Delete'}
        </button>
    )
}

function DeleteSkillButton({ studentId, skillId, onDeleted }) {
    const [loading, setLoading] = useState(false)
    const remove = async () => {
        if (!studentId || !skillId) return
        if (!window.confirm('Delete this skill?')) return
        setLoading(true)
        try {
            await api.delete(`/students/${studentId}/skills/${skillId}`)
            onDeleted && onDeleted()
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to delete skill')
        } finally {
            setLoading(false)
        }
    }
    return (
        <button onClick={remove} disabled={loading} className="text-xs px-2 py-1 rounded border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
            {loading ? 'Deleting...' : 'Delete'}
        </button>
    )
}

function DeleteCertificateButton({ id, onDeleted }) {
    const [loading, setLoading] = useState(false)
    const remove = async () => {
        if (!id) return
        if (!window.confirm('Delete this certificate?')) return
        setLoading(true)
        try {
            await api.delete(`/upload/certificates/${id}`)
            onDeleted && onDeleted()
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to delete certificate')
        } finally {
            setLoading(false)
        }
    }
    return (
        <button onClick={remove} disabled={loading} className="text-xs px-2 py-1 rounded border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
            {loading ? 'Deleting...' : 'Delete'}
        </button>
    )
}

