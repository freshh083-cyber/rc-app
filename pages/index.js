import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, isSameDay, parseISO } from 'date-fns'
import Link from 'next/link'

export default function Home() {
  const [courses, setCourses] = useState([])
  const [view, setView] = useState('cards')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [regions, setRegions] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: regionData } = await supabase.from('regions').select('*').order('name')
      setRegions(regionData || [])

      const { data: courseData } = await supabase
        .from('courses')
        .select('*, regions(name)')
        .eq('status', 'active')
        .order('start_time')
      setCourses(courseData || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = courses.filter(c => {
    if (selectedRegion !== 'all' && c.region_id !== selectedRegion) return false
    if (selectedDate && !isSameDay(parseISO(c.start_time), selectedDate)) return false
    return true
  })

  const coursesOnDay = (date) =>
    courses.filter(c =>
      (selectedRegion === 'all' || c.region_id === selectedRegion) &&
      isSameDay(parseISO(c.start_time), date)
    )

  const daysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []
    // pad start
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1B2A4A] text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Recovery College Alberta</h1>
              <p className="text-teal-300 text-sm mt-0.5">Courses & Registration</p>
            </div>
            <div className="text-right text-sm text-blue-200">
              <p>Need help? Contact your regional team</p>
            </div>
          </div>
        </div>
      </header>

      {/* Filters + view toggle */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600">Region:</label>
            <select
              value={selectedRegion}
              onChange={e => { setSelectedRegion(e.target.value); setSelectedDate(null) }}
              className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Regions</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full hover:bg-teal-200"
              >
                {format(selectedDate, 'MMM d')} ✕
              </button>
            )}
          </div>
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setView('cards')}
              className={`px-4 py-1.5 text-sm font-medium transition ${view === 'cards' ? 'bg-[#0D9488] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Cards
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-1.5 text-sm font-medium transition ${view === 'calendar' ? 'bg-[#0D9488] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading courses...</div>
        ) : view === 'cards' ? (
          <>
            <p className="text-sm text-gray-500 mb-6">{filtered.length} course{filtered.length !== 1 ? 's' : ''} available</p>
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">No courses found for this filter.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(course => <CourseCard key={course.id} course={course} />)}
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Month nav */}
                <div className="flex items-center justify-between px-5 py-3 border-b">
                  <button
                    onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                  >←</button>
                  <span className="font-semibold text-gray-800">{format(currentMonth, 'MMMM yyyy')}</span>
                  <button
                    onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                  >→</button>
                </div>
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                    <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
                  ))}
                </div>
                {/* Days grid */}
                <div className="grid grid-cols-7">
                  {daysInMonth().map((day, i) => {
                    if (!day) return <div key={i} className="border-b border-r h-16 bg-gray-50" />
                    const dayCourses = coursesOnDay(day)
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    const isToday = isSameDay(day, new Date())
                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedDate(isSelected ? null : day)}
                        className={`border-b border-r h-16 p-1 cursor-pointer transition ${isSelected ? 'bg-teal-50 border-teal-200' : 'hover:bg-gray-50'}`}
                      >
                        <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-0.5 ${isToday ? 'bg-[#1B2A4A] text-white' : 'text-gray-700'}`}>
                          {format(day, 'd')}
                        </div>
                        {dayCourses.slice(0, 2).map(c => (
                          <div key={c.id} className="text-xs bg-teal-100 text-teal-800 rounded px-1 truncate mb-0.5 leading-4">
                            {c.title}
                          </div>
                        ))}
                        {dayCourses.length > 2 && (
                          <div className="text-xs text-teal-600">+{dayCourses.length - 2} more</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar: courses for selected day or upcoming */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Upcoming courses'}
              </h2>
              <div className="space-y-3">
                {filtered.length === 0 ? (
                  <p className="text-sm text-gray-400">No courses on this date.</p>
                ) : (
                  filtered.slice(0, 8).map(course => <CourseCard key={course.id} course={course} compact />)
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function CourseCard({ course, compact }) {
  const start = parseISO(course.start_time)
  const end = parseISO(course.end_time)
  const spotsLeft = course.max_participants

  if (compact) {
    return (
      <Link href={`/courses/${course.id}`}>
        <div className="bg-white rounded-lg border p-3 hover:shadow-sm hover:border-teal-300 transition cursor-pointer">
          <div className="text-xs text-teal-600 font-medium mb-0.5">{format(start, 'EEE MMM d · h:mm a')}</div>
          <div className="font-medium text-gray-800 text-sm leading-snug">{course.title}</div>
          <div className="text-xs text-gray-500 mt-0.5">{course.regions?.name}</div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/courses/${course.id}`}>
      <div className="bg-white rounded-xl border shadow-sm hover:shadow-md hover:border-teal-300 transition cursor-pointer overflow-hidden group">
        {/* Top accent */}
        <div className="h-1 bg-[#0D9488]" />
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
              {course.regions?.name}
            </span>
            {course.is_recurring && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Recurring</span>
            )}
          </div>
          <h3 className="font-bold text-gray-900 text-lg leading-snug mb-1 group-hover:text-teal-700 transition">{course.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">{course.description}</p>
          <div className="space-y-1.5 text-sm text-gray-600">
            <div className="flex gap-2">
              <span>📅</span>
              <span>{format(start, 'EEEE, MMMM d · h:mm a')} – {format(end, 'h:mm a')}</span>
            </div>
            {course.location && (
              <div className="flex gap-2">
                <span>📍</span>
                <span>{course.location}</span>
              </div>
            )}
            {course.facilitator && (
              <div className="flex gap-2">
                <span>👤</span>
                <span>{course.facilitator}</span>
              </div>
            )}
            {course.max_participants && (
              <div className="flex gap-2">
                <span>👥</span>
                <span>Max {course.max_participants} participants</span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t">
            <span className="inline-block bg-[#0D9488] text-white text-sm font-semibold px-4 py-2 rounded-lg group-hover:bg-[#0f766e] transition">
              Register →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
