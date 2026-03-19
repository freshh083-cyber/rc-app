import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { format, parseISO } from 'date-fns'

// ─── CSV template headers ────────────────────────────────────────────────────
const CSV_HEADERS = 'title,description,facilitator,location,date,start_time,end_time,max_participants,is_recurring'
const CSV_EXAMPLE = `Introduction to Recovery,"An overview of recovery principles and how they apply to daily life.",Jane Smith,Room 101 - Main Building,2026-04-15,10:00,11:30,20,no
Mindfulness & Wellness,"Weekly mindfulness practice session. All levels welcome.",Mark Jones,Wellness Centre,2026-04-22,14:00,15:00,15,yes`

export default function AdminPage() {
  const [region, setRegion] = useState(null)
  const [regions, setRegions] = useState([])
  const [courses, setCourses] = useState([])
  const [view, setView] = useState('courses') // courses | add | upload | registrations
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.from('regions').select('*').order('name').then(({ data }) => setRegions(data || []))
  }, [])

  useEffect(() => {
    if (!region) return
    loadCourses()
  }, [region])

  async function loadCourses() {
    setLoading(true)
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('region_id', region.id)
      .order('start_time')
    setCourses(data || [])
    setLoading(false)
  }

  async function loadRegistrations(courseId) {
    const { data } = await supabase
      .from('registrations')
      .select('*, participants(*)')
      .eq('course_id', courseId)
      .order('registered_at')
    setRegistrations(data || [])
  }

  async function toggleAttendance(regId, current) {
    await supabase.from('registrations').update({ attended: !current }).eq('id', regId)
    setRegistrations(r => r.map(x => x.id === regId ? { ...x, attended: !current } : x))
  }

  async function deleteCourse(courseId) {
    if (!confirm('Delete this course? This will also remove all registrations.')) return
    await supabase.from('registrations').delete().eq('course_id', courseId)
    await supabase.from('courses').delete().eq('id', courseId)
    loadCourses()
    setSuccess('Course deleted.')
    setTimeout(() => setSuccess(null), 3000)
  }

  if (!region) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-[#1B2A4A] rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🏫</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Region Admin Portal</h1>
            <p className="text-sm text-gray-500 mt-1">Recovery College Alberta</p>
          </div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select your region to continue</label>
          <select
            onChange={e => {
              const r = regions.find(x => x.id === e.target.value)
              if (r) setRegion(r)
            }}
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white mb-4"
          >
            <option value="">Choose region...</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <p className="text-xs text-gray-400 text-center">Full authentication coming in v2</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1B2A4A] text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Region Admin Portal</h1>
            <p className="text-teal-300 text-sm">{region.name} Recovery College</p>
          </div>
          <button onClick={() => setRegion(null)} className="text-xs text-blue-300 hover:text-white border border-blue-400 px-3 py-1.5 rounded-lg transition">
            Switch Region
          </button>
        </div>
      </header>

      {/* Nav tabs */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 py-2">
          {[
            { key: 'courses', label: '📋  My Courses' },
            { key: 'add', label: '➕  Add Course' },
            { key: 'upload', label: '📤  Bulk Upload' },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setView(tab.key); setSelectedCourse(null); setError(null); setSuccess(null) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === tab.key ? 'bg-[#0D9488] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {success && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">✅ {success}</div>}
        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">❌ {error}</div>}

        {/* ── COURSES LIST ── */}
        {view === 'courses' && !selectedCourse && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-lg">{region.name} Courses</h2>
              <span className="text-sm text-gray-500">{courses.length} total</span>
            </div>
            {loading ? (
              <div className="text-center py-20 text-gray-400">Loading...</div>
            ) : courses.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 mb-4">No courses yet for {region.name}.</p>
                <button onClick={() => setView('add')} className="bg-[#0D9488] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] transition">
                  Add your first course →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map(course => (
                  <CourseRow key={course.id} course={course}
                    onViewRegistrations={async () => {
                      setSelectedCourse(course)
                      setView('registrations')
                      await loadRegistrations(course.id)
                    }}
                    onDelete={() => deleteCourse(course.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── REGISTRATIONS ── */}
        {view === 'registrations' && selectedCourse && (
          <RegistrationsView
            course={selectedCourse}
            registrations={registrations}
            onBack={() => { setView('courses'); setSelectedCourse(null) }}
            onToggleAttendance={toggleAttendance}
          />
        )}

        {/* ── ADD COURSE ── */}
        {view === 'add' && (
          <AddCourseForm
            region={region}
            onSuccess={() => {
              loadCourses()
              setView('courses')
              setSuccess('Course added successfully!')
              setTimeout(() => setSuccess(null), 4000)
            }}
            onError={setError}
          />
        )}

        {/* ── BULK UPLOAD ── */}
        {view === 'upload' && (
          <BulkUpload
            region={region}
            onSuccess={(count) => {
              loadCourses()
              setView('courses')
              setSuccess(`${count} course${count !== 1 ? 's' : ''} imported successfully!`)
              setTimeout(() => setSuccess(null), 4000)
            }}
            onError={setError}
          />
        )}
      </main>
    </div>
  )
}

// ─── Course row ───────────────────────────────────────────────────────────────
function CourseRow({ course, onViewRegistrations, onDelete }) {
  const start = parseISO(course.start_time)
  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-wrap items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900 truncate">{course.title}</span>
          {course.is_recurring && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full shrink-0">Recurring</span>}
        </div>
        <div className="text-sm text-gray-500 flex flex-wrap gap-3">
          <span>📅 {format(start, 'MMM d, yyyy · h:mm a')}</span>
          {course.location && <span>📍 {course.location}</span>}
          {course.max_participants && <span>👥 Max {course.max_participants}</span>}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={onViewRegistrations}
          className="text-sm bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-lg font-medium transition">
          View Registrations
        </button>
        <button onClick={onDelete}
          className="text-sm bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition">
          Delete
        </button>
      </div>
    </div>
  )
}

// ─── Registrations view ───────────────────────────────────────────────────────
function RegistrationsView({ course, registrations, onBack, onToggleAttendance }) {
  const attended = registrations.filter(r => r.attended).length

  function downloadCSV() {
    const rows = [
      ['First Name','Last Name','Email','Phone','Registered At','Attended'],
      ...registrations.map(r => [
        r.participants.first_name, r.participants.last_name,
        r.participants.email, r.participants.phone || '',
        format(parseISO(r.registered_at), 'yyyy-MM-dd HH:mm'),
        r.attended ? 'Yes' : 'No'
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${course.title.replace(/\s+/g,'-')}-registrations.csv`
    a.click()
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="text-sm text-teal-600 hover:text-teal-800">← Back to courses</button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600 font-medium">{course.title}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Registered', value: registrations.length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Attended', value: attended, color: 'bg-green-50 text-green-700' },
          { label: 'Absent', value: registrations.length - attended, color: 'bg-red-50 text-red-600' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 text-center ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
          <span className="font-semibold text-gray-800 text-sm">Participant List</span>
          {registrations.length > 0 && (
            <button onClick={downloadCSV}
              className="text-xs bg-[#1B2A4A] text-white px-3 py-1.5 rounded-lg hover:bg-[#253d6b] transition font-medium">
              ⬇ Download CSV
            </button>
          )}
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No registrations yet for this course.</div>
        ) : (
          <div className="divide-y">
            {registrations.map(reg => (
              <div key={reg.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm">
                    {reg.participants.first_name} {reg.participants.last_name}
                  </div>
                  <div className="text-xs text-gray-500">{reg.participants.email}</div>
                  {reg.participants.phone && <div className="text-xs text-gray-400">{reg.participants.phone}</div>}
                </div>
                <div className="text-xs text-gray-400 shrink-0 hidden sm:block">
                  Registered {format(parseISO(reg.registered_at), 'MMM d')}
                </div>
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input type="checkbox" checked={reg.attended}
                    onChange={() => onToggleAttendance(reg.id, reg.attended)}
                    className="accent-teal-600 w-4 h-4" />
                  <span className={`text-xs font-medium ${reg.attended ? 'text-green-600' : 'text-gray-400'}`}>
                    {reg.attended ? 'Attended' : 'Mark attended'}
                  </span>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Add course form ──────────────────────────────────────────────────────────
function AddCourseForm({ region, onSuccess, onError }) {
  const [form, setForm] = useState({
    title: '', description: '', facilitator: '', location: '',
    date: '', start_time: '', end_time: '', max_participants: '', is_recurring: false
  })
  const [submitting, setSubmitting] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const start = new Date(`${form.date}T${form.start_time}:00`)
      const end = new Date(`${form.date}T${form.end_time}:00`)

      const { error } = await supabase.from('courses').insert({
        title: form.title,
        description: form.description || null,
        facilitator: form.facilitator || null,
        location: form.location || null,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        max_participants: form.max_participants ? parseInt(form.max_participants) : null,
        is_recurring: form.is_recurring,
        region_id: region.id,
        status: 'active'
      })
      if (error) throw error
      onSuccess()
    } catch (err) {
      onError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-bold text-gray-900 text-lg mb-5">Add New Course — {region.name}</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        <F label="Course Title *" value={form.title} onChange={v => set('title', v)} required />
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <F label="Facilitator" value={form.facilitator} onChange={v => set('facilitator', v)} />
          <F label="Location" value={form.location} onChange={v => set('location', v)} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <F label="Date *" type="date" value={form.date} onChange={v => set('date', v)} required />
          <F label="Start Time *" type="time" value={form.start_time} onChange={v => set('start_time', v)} required />
          <F label="End Time *" type="time" value={form.end_time} onChange={v => set('end_time', v)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <F label="Max Participants" type="number" value={form.max_participants} onChange={v => set('max_participants', v)} placeholder="Leave blank for unlimited" />
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_recurring} onChange={e => set('is_recurring', e.target.checked)} className="accent-teal-600 w-4 h-4" />
              <span className="text-sm text-gray-700">Recurring course</span>
            </label>
          </div>
        </div>
        <div className="pt-2">
          <button type="submit" disabled={submitting}
            className="w-full bg-[#0D9488] text-white font-semibold py-2.5 rounded-lg hover:bg-[#0f766e] transition disabled:opacity-60">
            {submitting ? 'Adding...' : 'Add Course'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Bulk upload ──────────────────────────────────────────────────────────────
function BulkUpload({ region, onSuccess, onError }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  function downloadTemplate() {
    const content = CSV_HEADERS + '\n' + CSV_EXAMPLE
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rc-course-upload-template.csv'
    a.click()
  }

  function parseCSV(text) {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    return lines.slice(1).map(line => {
      const vals = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) || []
      const obj = {}
      headers.forEach((h, i) => { obj[h] = (vals[i] || '').replace(/^"|"$/g, '').trim() })
      return obj
    }).filter(r => r.title)
  }

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target.result)
        setPreview(rows)
      } catch (err) {
        onError('Could not parse file. Please use the template format.')
      }
    }
    reader.readAsText(f)
  }

  async function handleUpload() {
    if (!preview.length) return
    setUploading(true)
    try {
      const courses = preview.map(row => {
        const start = new Date(`${row.date}T${row.start_time}:00`)
        const end = new Date(`${row.date}T${row.end_time}:00`)
        return {
          title: row.title,
          description: row.description || null,
          facilitator: row.facilitator || null,
          location: row.location || null,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          max_participants: row.max_participants ? parseInt(row.max_participants) : null,
          is_recurring: row.is_recurring?.toLowerCase() === 'yes',
          region_id: region.id,
          status: 'active'
        }
      })
      const { error } = await supabase.from('courses').insert(courses)
      if (error) throw error
      onSuccess(courses.length)
    } catch (err) {
      onError('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h2 className="font-bold text-gray-900 text-lg mb-2">Bulk Upload Courses — {region.name}</h2>
      <p className="text-sm text-gray-500 mb-5">Upload a CSV file to add multiple courses at once. Download the template to get started.</p>

      {/* Template download */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between mb-5">
        <div>
          <div className="font-medium text-blue-800 text-sm">📄 Download the course upload template</div>
          <div className="text-xs text-blue-600 mt-0.5">Fill it in with your courses, then upload it below</div>
        </div>
        <button onClick={downloadTemplate}
          className="bg-[#1B2A4A] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#253d6b] transition shrink-0">
          Download Template
        </button>
      </div>

      {/* File drop zone */}
      <div
        onClick={() => fileRef.current.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition mb-5"
      >
        <div className="text-3xl mb-2">📤</div>
        <div className="font-medium text-gray-700">{file ? file.name : 'Click to upload your CSV file'}</div>
        <div className="text-xs text-gray-400 mt-1">.csv files only</div>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
      </div>

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden mb-5">
          <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
            <span className="font-semibold text-gray-800 text-sm">{preview.length} course{preview.length !== 1 ? 's' : ''} ready to import</span>
            <span className="text-xs text-gray-400">Review before uploading</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Title','Date','Start','End','Location','Facilitator','Max','Recurring'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {preview.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{row.title}</td>
                    <td className="px-3 py-2 text-gray-600">{row.date}</td>
                    <td className="px-3 py-2 text-gray-600">{row.start_time}</td>
                    <td className="px-3 py-2 text-gray-600">{row.end_time}</td>
                    <td className="px-3 py-2 text-gray-600">{row.location}</td>
                    <td className="px-3 py-2 text-gray-600">{row.facilitator}</td>
                    <td className="px-3 py-2 text-gray-600">{row.max_participants || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${row.is_recurring?.toLowerCase() === 'yes' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                        {row.is_recurring?.toLowerCase() === 'yes' ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {preview.length > 0 && (
        <button onClick={handleUpload} disabled={uploading}
          className="w-full bg-[#0D9488] text-white font-semibold py-3 rounded-xl hover:bg-[#0f766e] transition disabled:opacity-60">
          {uploading ? 'Uploading...' : `Upload ${preview.length} Course${preview.length !== 1 ? 's' : ''} →`}
        </button>
      )}
    </div>
  )
}

// ─── Shared ───────────────────────────────────────────────────────────────────
function F({ label, type = 'text', value, onChange, required, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        required={required} placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
    </div>
  )
}
