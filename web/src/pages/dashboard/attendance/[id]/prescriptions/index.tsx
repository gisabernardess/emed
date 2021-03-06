import {
  Button,
  Flex,
  Heading,
  HStack,
  Stack,
  useColorModeValue,
} from '@chakra-ui/react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { parseCookies } from 'nookies'
import { Column } from 'primereact/column'
import React, { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { FaTimes } from 'react-icons/fa'
import { GoPlus } from 'react-icons/go'
import { Prescription } from '@/components/report/layout/Prescription'
import { Select } from '@/components/form/select'
import { usePrinter } from '@/components/report/usePrinter'
import Table from '@/components/table'
import { Attendance } from '@/models/attendance.model'
import { Exam } from '@/models/exam.model'
import { Medicine } from '@/models/medicine.model'
import { api } from '@/services/api'
import { getAPIClient } from '@/services/axios'
import { useNotification } from '@/services/hooks/useNotification'
import { EMED_TOKEN } from '@/utils/constants'

interface IPrescriptionsInputs {
  exam?: Exam
  medicine?: Medicine
}

interface IPrescriptionsProps {
  attendanceId: number
  attendance: Attendance
  exams: Exam[]
  medicines: Medicine[]
}

const Prescriptions: React.FC<IPrescriptionsProps> = ({
  attendanceId,
  attendance: { patient, medicalRecord },
  exams,
  medicines,
}) => {
  const router = useRouter()
  const notification = useNotification()
  const { printPDF } = usePrinter();

  const [listOfExams, setListOfExams] = useState<Exam[]>([])
  const [listOfMedicines, setListOfMedicines] = useState<Medicine[]>([])

  const methods = useForm<IPrescriptionsInputs>({
    mode: 'onChange',
  })

  const watchExamId = methods.watch('exam')
  const watchMedicineId = methods.watch('medicine')

  const addExam = () => {
    const exam = exams.find(value => value.id === Number(watchExamId))
    if (exam) setListOfExams([...listOfExams, exam])
  }

  const addMedicine = () => {
    const med = medicines.find(value => value.id === Number(watchMedicineId))
    if (med) setListOfMedicines([...listOfMedicines, med])
  }

  const handleUpdateAttendance = async () => {
    try {
      let examIds, medicineIds
      if (listOfExams.length > 0) examIds = listOfExams.map(({ id }) => id)
      if (listOfMedicines.length > 0)
        medicineIds = listOfMedicines.map(({ id }) => id)

      await api
        .put(`/prescriptions/${medicalRecord.id}`, {
          id: medicalRecord.id,
          examIds,
          medicineIds,
        })
        .then(() => {
          notification.success({
            title: 'Prescription successfully generated',
            to: `/dashboard/attendance/${attendanceId}`,
          })
          handlePrinter()
        })
        .catch(({ response }) => {
          notification.error({ message: response.data.error })
        })
    } catch (error) {
      notification.error()
    }
  }

  const handlePrinter = () => {
    const docBody = Prescription({patient, exams: listOfExams, medicines: listOfMedicines});
    printPDF({ docBody });
  };

  return (
    <FormProvider {...methods}>
      <Flex
        as="form"
        align={'center'}
        justify={'center'}
        onSubmit={methods.handleSubmit(handleUpdateAttendance)}
      >
        <Stack
          spacing={4}
          w={'full'}
          maxW={'5xl'}
          bg={useColorModeValue('white', 'gray.700')}
          rounded={'xl'}
          boxShadow={'lg'}
          p={6}
          my={6}
        >
          <Heading lineHeight={1.1} fontSize={{ base: '2xl', sm: '3xl' }}>
            Prescriptions
          </Heading>

          <Heading size={'md'}>Exams</Heading>
          <Table
            values={listOfExams}
            header={
              <HStack>
                <Select
                  name="exam"
                  options={exams.map(({ id, name }: Exam) => {
                    return {
                      label: name,
                      value: `${id}`,
                    }
                  })}
                />
                <Button
                  colorScheme="green"
                  variant="outline"
                  onClick={() => addExam()}
                >
                  <GoPlus />
                </Button>
              </HStack>
            }
          >
            <Column field="name" />
            <Column
              body={row => (
                <Flex flexDirection="row" justifyContent="end">
                  <Button
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => {
                      setListOfExams(
                        listOfExams.filter(({ id }) => id !== row.id),
                      )
                    }}
                  >
                    <FaTimes />
                  </Button>
                </Flex>
              )}
              exportable={false}
            />
          </Table>

          <Heading size={'md'}>Medicines</Heading>
          <Table
            values={listOfMedicines}
            header={
              <HStack>
                <Select
                  name="medicine"
                  options={medicines.map(
                    ({
                      id,
                      name,
                      concentration,
                      usage,
                      producer,
                    }: Medicine) => {
                      return {
                        label: `${name} ${concentration} ${usage} (${producer})`,
                        value: `${id}`,
                      }
                    },
                  )}
                />
                <Button
                  colorScheme="green"
                  variant="outline"
                  onClick={() => addMedicine()}
                >
                  <GoPlus />
                </Button>
              </HStack>
            }
          >
            <Column
              body={row =>
                `${row.name} ${row.concentration} ${row.usage} (${row.producer})`
              }
            />
            <Column
              body={row => (
                <Flex flexDirection="row" justifyContent="end">
                  <Button
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => {
                      setListOfMedicines(
                        listOfMedicines.filter(({ id }) => id !== row.id),
                      )
                    }}
                  >
                    <FaTimes />
                  </Button>
                </Flex>
              )}
              exportable={false}
            />
          </Table>

          <Stack spacing={6} direction={['column', 'row']}>
            <Button
              w="full"
              colorScheme="red"
              onClick={() =>
                router.push(`/dashboard/attendance/${attendanceId}`)
              }
            >
              Cancel
            </Button>
            <Button
              type='submit'
              w="full"
              colorScheme="green"
              isLoading={methods.formState.isSubmitting}
              disabled={!methods.formState.isValid}
              data-testid="submit-form-button"
            >
              Save
            </Button>
          </Stack>
        </Stack>
      </Flex>
    </FormProvider>
  )
}

export default Prescriptions

export const getServerSideProps: GetServerSideProps = async ctx => {
  const apiClient = getAPIClient(ctx)

  const { [EMED_TOKEN]: token } = parseCookies(ctx)

  if (!token) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  const { params } = ctx
  const exams = await apiClient.get('/exams')
  const medicines = await apiClient.get('/medicines')
  const attendance = await apiClient.get(`/attendances/${params?.id}`)

  return {
    props: {
      attendanceId: params?.id,
      attendance: attendance?.data,
      exams: exams.data,
      medicines: medicines?.data,
    },
  }
}
