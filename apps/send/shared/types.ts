export interface ImportResult {
  studyId: string
  studyCode: string
  studyTitle: string
  subjectCount: number
  domainCounts: Record<string, number>
}
